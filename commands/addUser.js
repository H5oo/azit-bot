const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const members = require('../data/members');
const { getPuuidByRiotId } = require('../utils/riotApi');

const membersPath = path.join(__dirname, '../data/members.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('클랜원추가')
    .setDescription('새로운 클랜원을 등록합니다.')
    .addStringOption(option =>
      option.setName('name')
            .setDescription('소환사 이름')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('tag')
            .setDescription('Riot 태그 (예: KR1)')
            .setRequired(true)),

  async execute(interaction) {
    // ===== 역할 기반 권한 체크 =====
    const allowedRoles = ['1432287432547762187'];
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
    
    if (!hasPermission) {
      return interaction.reply({ content: '권한이 없습니다.', ephemeral: true });
    }

    const name = interaction.options.getString('name');
    const tag  = interaction.options.getString('tag');

    // 이미 등록된 사용자인지 체크
    if (members.some(m => m.name === name && m.tag === tag)) {
      return interaction.reply({ content: '이미 등록된 클랜원입니다.', ephemeral: true });
    }

    await interaction.reply({ content: `${name}#${tag} 등록 중...`, ephemeral: true });

    // puuid 조회
    try {
      const riotUser = await getPuuidByRiotId(name, tag);
    } catch (err) {
      console.error(err);
      return interaction.editReply('클랜원 등록 실패: 아이디와 태그를 확인해주세요');
    }

    // 새로운 멤버 객체 생성
    const newMember = {
      name: riotUser.gameName,   // API에서 받은 실제 이름
      tag: riotUser.tagLine,     // API에서 받은 실제 태그
      puuid: riotUser.puuid,
      count: 0
    };
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