/*****************
 * 월말정산 버튼 처리 핸들러
 *****************/

const members = require('../../data/members');
const { getPuuidByRiotId, getMatchIdsByPuuid, getMatchDetail } = require('../../utils/riotApi');
const { getMonthTimestamps } = require('../../utils/date');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle  } = require('discord.js');

const selectedMonth = 10;      // 예: 사용자가 선택한 10월
const currentYear = new Date().getFullYear();
const { startTime, endTime } = getMonthTimestamps(currentYear, selectedMonth);

// startTime보다 30분 빠르게 조회
const queryStartTime = startTime - 30 * 60; // 30분 = 1800초

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  async execute(interaction, selectedMonth) {
    try {
      // 1️⃣ 기존 메시지의 모든 버튼 비활성화
      const disabledRows = interaction.message.components.map(row => {
        return new ActionRowBuilder().addComponents(
          row.components.map(component =>
            ButtonBuilder.from(component).setDisabled(true)
          )
        );
      });

      // 2️⃣ 메시지를 업데이트하여 버튼 비활성화 적용
      await interaction.update({
        content: `✅ ${selectedMonth}월 월말정산을 선택했습니다.`,
        components: disabledRows,
      });

      await interaction.reply({ 
        content: `✅ ${selectedMonth}월 정산을 진행중입니다....`,
        ephemeral: true 
      });

      const checkedMatchIds = new Set(); // 이미 처리한 매치 ID 기록

      for (const member of members) {
        // 이미 count가 10이면 더 이상 처리하지 않음
        if ((member.count || 0) >= 10) continue;

        const { name, tag } = member;
        try {
            const puuid = member.puuid;
            
            // 매치 ID 조회
            const matchIds = await getMatchIdsByPuuid(puuid, queryStartTime, endTime);
            console.log(`✅ ${name}#${tag} → ${matchIds.length}개의 매치 조회`);

            // 각 매치별 상세 정보 조회
            for (const matchId of matchIds) {
              // 이미 처리한 매치면 건너뜀
              if (checkedMatchIds.has(matchId)) continue;

              const matchData = await getMatchDetail(matchId);
              await sleep(1000); 
              
              const gameEnd = matchData.gameEndTimestamp;
              
              // startTime 기준 필터
              if (gameEnd <= startTime) continue;

              // 1️⃣ 내 팀 추출
              const myIndex = matchData.participants.findIndex(p => p.puuid === puuid);
              const myTeam  = myIndex < 5
                            ? matchData.participants.slice(0, 5)
                            : matchData.participants.slice(5, 10);

              // 2️⃣ 팀 내 members 포함 여부 확인
              const hasAnyMember = myTeam.some(p =>
                                                  members.some(m =>
                                                      p.riotIdGameName === m.name && p.riotIdTagline === m.tag
                                                  )
                                              );

              if (!hasAnyMember) continue;

              checkedMatchIds.add(matchId);
              
              for (const p of myTeam) {
                const matchedMember = members.find(m =>
                  p.riotIdGameName === m.name && p.riotIdTagline === m.tag
                );
                if (matchedMember) {
                  // count가 이미 10이면 증가시키지 않고 패스
                  if ((matchedMember.count || 0) >= 10) continue;

                  matchedMember.count = (matchedMember.count || 0) + 1;
                }
              }

            }

        } catch (err) {
            console.error(`❌ ${name}#${tag} 조회 실패`);
        }
      }

      // members를 count 기준 내림차순 정렬
      const sortedMembers = [...members].sort((a, b) => (b.count || 0) - (a.count || 0));

      // description에 한 줄씩 추가
      const description = sortedMembers
        .map(m => `${m.name}#${m.tag}: ${m.count || 0}회`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`${selectedMonth}월 월말정산 결과`)
        .setColor(0x1abc9c)
        .setDescription(description);

      // interaction.reply()는 이미 처리 메시지를 보냈으므로 followUp 사용
      await interaction.followUp({ embeds: [embed] });

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