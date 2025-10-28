const { SlashCommandBuilder } = require('discord.js');
const members = require('../data/members.js');
const { getPuuidByRiotId } = require('../utils/riotApi.js');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');
const { rateLimitedFetch } = require('../utils/rateLimiter.js'); // RateLimit 적용

if (process.env.DISABLE_UPDATE_USERS === 'true') {
  module.exports = {}; // 명령어 자체를 내보내지 않음
  return;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('클랜원갱신')             // 명령어 이름 (띄어쓰기 불가, 한글 가능)
    .setDescription('등록된 클랜원 정보를 갱신합니다.'),  // 설명

  async execute(interaction) {
    await interaction.reply({ content: '클랜원 정보를 갱신 중입니다...', ephemeral: true });

    for (const member of members) {
        try {
          // Rate Limit 적용 + API 전체 응답
          const res = await rateLimitedFetch(getPuuidByRiotId, member.name, member.tag);

          // API 응답 전체 객체 적용 (name, tag, puuid)
          member.puuid = res.puuid;
          member.name  = res.gameName;   // 대소문자 정정
          member.tag   = res.tagLine;    // 대소문자 정정
        } catch (err) {
          console.error(`❌ ${member.name}#${member.tag} 갱신 실패`, err);
        }
    }

    // 갱신된 members를 파일에 저장
    fs.writeFileSync(
    membersPath,
    `/**\n * 사용자 목록\n */\nmodule.exports = ${JSON.stringify(members, null, 2)};\n`,
    'utf-8'
    );

    await interaction.editReply('모든 클랜원 갱신 완료!');
  }
};