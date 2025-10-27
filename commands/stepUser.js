const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');
let members = require(membersPath);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('스탭등록')
    .setDescription('기존 멤버의 스탭 상태를 변경합니다.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('사용자 이름')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('사용자 태그')
        .setRequired(true)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const tag = interaction.options.getString('tag');

    const member = members.find(m => m.name === name && m.tag === tag);
    if (!member) {
      await interaction.reply({ content: `❌ ${name}#${tag} 사용자를 찾을 수 없습니다.`, ephemeral: true });
      return;
    }

    member.isLeader = !member.isLeader; // 토글
    const status = member.isLeader ? '스탭으로 등록됨' : '스탭 해제됨';

    const fileContent = `module.exports = ${JSON.stringify(members, null, 2)};`;
    fs.writeFileSync(membersPath, fileContent);

    await interaction.reply({ content: `✅ ${name}#${tag} ${status}`, ephemeral: true });
  }
};