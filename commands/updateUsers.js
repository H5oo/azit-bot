const { SlashCommandBuilder } = require('discord.js');
const members = require('../data/members');
const { getPuuidByRiotId } = require('../utils/riotApi');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');

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
        if (!member.puuid) {          // puuid가 없을 때만 API 호출
            member.puuid = await getPuuidByRiotId(member.name, member.tag);
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