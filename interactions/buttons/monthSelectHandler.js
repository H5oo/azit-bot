/*****************
 * 월말정산 버튼 처리 핸들러
 *****************/

const members = require('../../data/members');
const { getMatchIdsByPuuid, getMatchDetail } = require('../../utils/riotApi');
const { getMonthTimestamps } = require('../../utils/date');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { rateLimitedFetch } = require('../../utils/rateLimiter.js');

// ===== 설정값 =====
const MAX_COUNT_LIMIT = 10;       // 카운트 제한 수치
const ENFORCE_MAX_COUNT = true;   // true: 제한 적용 / false: 제한 없이 누적

// ===== Handler =====
module.exports = {
  async execute(interaction, selectedMonth) {
    try {
      const startTimestamp = Date.now(); // ⬅ 시작 시간 기록

      // ===== 1️interaction 즉시 처리 (버튼 클릭 응답) =====
      await interaction.deferUpdate(); // interaction을 디퍼(defer) 처리

      // 1️⃣ 기존 메시지의 모든 버튼 비활성화
      const disabledRows = interaction.message.components.map(row => {
        return new ActionRowBuilder().addComponents(
          row.components.map(component =>
            ButtonBuilder.from(component).setDisabled(true)
          )
        );
      });

      // 메시지 업데이트 (버튼 비활성화)
      await interaction.editReply({
        content: `✅ ${selectedMonth}월 월말정산을 선택했습니다.`,
        components: disabledRows,
      });

      // ===== 2️⃣ 진행 메시지 (followUp) =====
      await interaction.followUp({
        content: `✅ ${selectedMonth}월 정산을 진행중입니다....`,
        ephemeral: true,
      });

      const currentYear = new Date().getFullYear();
      const { startTime, endTime } = getMonthTimestamps(currentYear, selectedMonth);

      // startTime보다 30분 빠르게 조회
      const queryStartTime = startTime - 30 * 60; // 30분 = 1800초

      const checkedMatchIds = new Set(); // 이미 처리한 매치 ID 기록

      for (const member of members) {
        // member 체크
        if (ENFORCE_MAX_COUNT && (member.count || 0) >= MAX_COUNT_LIMIT) continue;

        const { name, tag, puuid } = member;
        try {
            
            // 매치 ID 조회 (Rate Limit 적용)
            let count;
            if (!ENFORCE_MAX_COUNT) count = 100;
            const matchIds = await rateLimitedFetch(getMatchIdsByPuuid, puuid, queryStartTime, endTime, count);
            console.log(`✅ ${name}#${tag} → ${matchIds.length}개의 매치 조회`);

            // 각 매치별 상세 정보 조회
            for (const matchId of matchIds) {
              // 이미 처리한 매치면 건너뜀
              if (checkedMatchIds.has(matchId)) continue;

              const matchData = await rateLimitedFetch(getMatchDetail, matchId);
              
              // startTime 기준 필터
              const gameEnd = matchData.gameEndTimestamp;
              if (gameEnd <= startTime) continue;

              // 1️⃣ 내 팀 추출
              const myIndex = matchData.participants.findIndex(p => p.puuid === puuid);
              const myTeam  = myIndex < 5
                            ? matchData.participants.slice(0, 5)
                            : matchData.participants.slice(5, 10);

              // 내 정보
              const me = matchData.participants[myIndex];

              // 나를 제외한 팀원 중에서 members에 등록된 사람이 있는지 확인
              const hasAnyMember = myTeam.some(p =>
                p.puuid !== me.puuid && // 나 제외
                members.some(m => p.riotIdGameName === m.name && p.riotIdTagline === m.tag)
              );

              if (!hasAnyMember) continue;

              checkedMatchIds.add(matchId);
              
              for (const p of myTeam) {
                const matchedMember = members.find(m =>
                  p.riotIdGameName === m.name && p.riotIdTagline === m.tag
                );
                if (matchedMember) {
                  // 설정값에 따라 증가시키지 않고 패스
                  if (ENFORCE_MAX_COUNT && (matchedMember.count || 0) >= MAX_COUNT_LIMIT) continue;

                  matchedMember.count = (matchedMember.count || 0) + 1;
                }
              }

            }

        } catch (err) {
            console.error(`❌ ${name}#${tag} 조회 실패`);
        }
      }

      // ===== 처리 완료 후 시간 계산 =====
      const endTimestamp = Date.now();
      const durationMs = endTimestamp - startTimestamp;
      const durationSec = Math.floor(durationMs / 1000);
      const minutes = Math.floor(durationSec / 60);
      const seconds = durationSec % 60;

      // members를 count 기준 내림차순 정렬
      const sortedMembers = [...members].sort((a, b) => (b.count || 0) - (a.count || 0));

      // description에 한 줄씩 추가
      const description = sortedMembers
        .map(m => `${m.name}#${m.tag}: ${m.count || 0}회`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`${selectedMonth}월 월말정산 결과`)
        .setColor(0x1abc9c)
        .setDescription(description)
        .addFields({ name: '총 소요 시간', value: `${minutes}분 ${seconds}초`, inline: true });

      // 기존: interaction.followUp() → ❌ Token 만료 위험
      // 변경: 채널에 직접 메시지 전송 → ✅ 안전
      await interaction.channel.send({ embeds: [embed] });

      // ===== count 초기화 =====
      for (const m of members) {
        m.count = 0;
      }
      console.log('▶ members count 초기화 완료');

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '월말정산 처리 중 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  },
};