const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');
let members = require(membersPath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('사용자삭제')
    .setDescription('등록된 사용자를 삭제합니다.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('삭제할 사용자의 소환사 이름')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('삭제할 사용자의 태그')
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const tag = interaction.options.getString('tag');

    const index = members.findIndex(m => m.name === name && m.tag === tag);

    if (index === -1) {
      await interaction.reply({ content: `❌ ${name}#${tag} 사용자를 찾을 수 없습니다.`, ephemeral: true });
      return;
    }

    // 배열에서 제거
    members.splice(index, 1);

    // 파일에 다시 쓰기
    const fileContent = `module.exports = ${JSON.stringify(members, null, 2)};`;
    fs.writeFileSync(membersPath, fileContent);

    await interaction.reply({ content: `✅ ${name}#${tag} 사용자를 삭제했습니다.`, ephemeral: true });
  }
};