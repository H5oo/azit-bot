const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');
let members = require(membersPath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('클랜원삭제')
    .setDescription('등록된 클랜원을 삭제합니다.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('삭제할 클랜원의 소환사 이름')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('삭제할 클랜원의 태그')
        .setRequired(true)
    ),

  async execute(interaction) {
    // ===== 역할 기반 권한 체크 =====
    const allowedRoles = ['1432287432547762187'];
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
    
    if (!hasPermission) {
      return interaction.reply({ content: '권한이 없습니다.', ephemeral: true });
    }

    const name = interaction.options.getString('name');
    const tag = interaction.options.getString('tag');

    const index = members.findIndex(m => m.name === name && m.tag === tag);

    if (index === -1) {
      await interaction.reply({ content: `❌ ${name}#${tag} 클랜원을 찾을 수 없습니다.`, ephemeral: true });
      return;
    }

    // 배열에서 제거
    members.splice(index, 1);

    // 파일에 다시 쓰기
    const fileContent = `module.exports = ${JSON.stringify(members, null, 2)};`;
    fs.writeFileSync(membersPath, fileContent);

    await interaction.reply({ content: `✅ ${name}#${tag} 클랜원을 삭제했습니다.`, ephemeral: true });
  }
};