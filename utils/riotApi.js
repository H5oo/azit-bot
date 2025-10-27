/*****************
 * Riot API 호출 유틸
 *****************/
const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const BASE_URL = 'https://asia.api.riotgames.com';

/**
 * Riot ID로 계정의 PUUID 조회
 * @param {string} gameName - 소환사 이름
 * @param {string} tagLine - 태그
 * @returns {Promise<string>} PUUID
 */
async function getPuuidByRiotId(gameName, tagLine) {
  const url = `${BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  try {
    const res = await axios.get(url, {
      headers: { 'X-Riot-Token': RIOT_API_KEY },
    });
    const { puuid } = res.data;
    if (!puuid) throw new Error('PUUID not found in response');
    return puuid;
  } catch (err) {
    console.error(`❌ Riot API 요청 실패: ${gameName}#${tagLine}`);
    if (err.response) console.error(err.response.data);
    throw err;
  }
}

/**
 * PUUID로 매치 ID 배열 조회
 * @param {string} puuid - 소환사 PUUID
 * @param {number} startTime - 조회 시작 시각 (Unix timestamp, 초)
 * @param {number} endTime - 조회 종료 시각 (Unix timestamp, 초)
 * @param {number} queue - 게임 모드 
 * @param {number} count - 최대 매치 개수
 * @returns {Promise<string[]>} 매치 ID 배열
 */
async function getMatchIdsByPuuid(puuid, startTime, endTime, queue = 450, count = 1) {
  const url = `https://asia.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  try {
    const res = await axios.get(url, {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
      params: { startTime, endTime, queue, count },
    });
    return res.data; // 문자열 배열: [matchId1, matchId2, ...]
  } catch (err) {
    console.error(`❌ 매치 목록 조회 실패: ${puuid}`);
    if (err.response) console.error(err.response.data);
    throw err;
  }
}

/**
 * 단일 매치 상세 정보 조회
 * participants 배열만 반환
 * @param {string} matchId - 조회할 매치 ID
 * @returns {Promise<Array>} participants 배열 
 */
async function getMatchParticipants(matchId) {
  const url = `https://asia.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  try {
    const res = await axios.get(url, {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY },
    });
    return res.data.info.participants; // 10명 참가자 배열만 반환
  } catch (err) {
    console.error(`❌ 매치 상세 조회 실패: ${matchId}`);
    if (err.response) console.error(err.response.data);
    throw err;
  }
}

module.exports = { getPuuidByRiotId, getMatchIdsByPuuid, getMatchParticipants };