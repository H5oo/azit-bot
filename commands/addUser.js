const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const members = require('../data/members');
const { getPuuidByRiotId } = require('../utils/riotApi');

const membersPath = path.join(__dirname, '../data/members.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('사용자추가')
    .setDescription('새로운 사용자를 등록합니다.')
    .addStringOption(option =>
      option.setName('name')
            .setDescription('소환사 이름')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('tag')
            .setDescription('Riot 태그 (예: KR1)')
            .setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    const tag  = interaction.options.getString('tag');

    // 이미 등록된 사용자인지 체크
    if (members.some(m => m.name === name && m.tag === tag)) {
      return interaction.reply({ content: '이미 등록된 사용자입니다.', ephemeral: true });
    }

    await interaction.reply({ content: `${name}#${tag} 등록 중...`, ephemeral: true });

    // puuid 조회
    let puuid = '';
    try {
      puuid = await getPuuidByRiotId(name, tag);
    } catch (err) {
      console.error(err);
      return interaction.editReply('사용자 등록 실패: 아이디와 태그를 확인해주세요');
    }

    // 새로운 멤버 객체 생성
    const newMember = { name, tag, puuid, isLeader: false, count: 0 };
    members.push(newMember);

    // members.js 파일 업데이트
    fs.writeFileSync(
      membersPath,
      `/**\n * 사용자 목록\n */\nmodule.exports = ${JSON.stringify(members, null, 2)};\n`,
      'utf-8'
    );

    await interaction.editReply(`✅ ${name}#${tag} 등록 완료!`);
  },
};