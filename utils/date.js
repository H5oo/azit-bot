/*****************
 * 날짜/시간 유틸 함수
 * - 월별, 주별 등 기간 계산 함수
 *****************/

/**
 * 선택한 년/월을 받아 startTime, endTime 생성
 * @param {number} year  - 기준 연도 (예: 2025)
 * @param {number} month - 선택 월 (1~12)
 * @returns {{startTime: number, endTime: number}} Unix timestamp (초 단위)
 */
function getMonthTimestamps(year, month) {
  // JS Date에서 month는 0~11 이므로 -1 처리
  const start = new Date(year, month - 1, 1, 0, 0, 0);
  
  // 다음 달 1일 00:00:00에서 1초 뺀 값이 이번 달 마지막 23:59:59
  const end = new Date(year, month, 1, 0, 0, 0);
  end.setSeconds(end.getSeconds() - 1);

  return {
    startTime: Math.floor(start.getTime() / 1000), // 초 단위
    endTime: Math.floor(end.getTime() / 1000),
  };
}

module.exports = { getMonthTimestamps };