/*****************
 * 월말정산 버튼 처리 핸들러
 *****************/

const members = require('../../data/members');
const { getPuuidByRiotId, getMatchIdsByPuuid, getMatchParticipants } = require('../../utils/riotApi');
const { getMonthTimestamps } = require('../../utils/date');

const selectedMonth = 10;      // 예: 사용자가 선택한 10월
const currentYear = new Date().getFullYear();
const { startTime, endTime } = getMonthTimestamps(currentYear, selectedMonth);

// startTime보다 30분 빠르게 조회
const queryStartTime = startTime - 30 * 60; // 30분 = 1800초

module.exports = {
  async execute(interaction, selectedMonth) {
    try {
      // 여기에 실제 비즈니스 로직 구현
      // 예: DB 조회, 계산, API 호출 등

      await interaction.reply({
        content: `${selectedMonth}월 월말정산 데이터를 불러오는 중...`,
        ephemeral: true,
      });

      for (const member of members) {
        const { name, tag } = member;
        try {
            const puuid = await getPuuidByRiotId(name, tag);
            
            // 매치 ID 조회
            const matchIds = await getMatchIdsByPuuid(puuid, queryStartTime, endTime);
            console.log(`✅ ${name}#${tag} → ${matchIds.length}개의 매치 조회`);
            
            // 각 매치별 상세 정보 조회
            for (const matchId of matchIds) {
            const participants = await getMatchParticipants(matchId);
          console.log(`▶ ${member.name}#${member.tag} 매치 참가자:`, participants);
            // gameEndTimestamp를 사용해 startTime 기준 필터링 가능
            }

        } catch (err) {
            console.error(`❌ ${name}#${tag} 조회 실패`);
        }
      }

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '월말정산 처리 중 오류가 발생했습니다.',
        ephemeral: true,
      });
    }
  },
};