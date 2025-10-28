const { SlashCommandBuilder } = require('discord.js');
const members = require('../data/members');
const { getPuuidByRiotId } = require('../utils/riotApi');
const fs = require('fs');
const path = require('path');
const membersPath = path.join(__dirname, '../data/members.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('닉네임변경')
    .setDescription('클랜원 롤아이디 변경을 반영합니다.')
    .addStringOption(option =>
      option.setName('old_name')
            .setDescription('기존 닉네임')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('old_tag')
            .setDescription('기존 태그')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('new_name')
            .setDescription('새 닉네임')
            .setRequired(true))
    .addStringOption(option =>
      option.setName('new_tag')
            .setDescription('새 태그')
            .setRequired(true)),

  async execute(interaction) {
    const oldName = interaction.options.getString('old_name');
    const oldTag  = interaction.options.getString('old_tag');
    const newName = interaction.options.getString('new_name');
    const newTag  = interaction.options.getString('new_tag');

    // 1️⃣ 기존 멤버 찾기
    const member = members.find(m => m.name === oldName && m.tag === oldTag);
    if (!member) {
      return interaction.reply({ content: '존재하지 않는 클랜원입니다.', ephemeral: true });
    }

    await interaction.reply({ content: `${oldName}#${oldTag} 정보 업데이트 중...`, ephemeral: true });

    // 2️⃣ API 호출
    let puuid, gameName, tagLine;
    try {
      const data = await getPuuidByRiotId(newName, newTag);
      puuid    = data.puuid;
      gameName = data.gameName;
      tagLine  = data.tagLine;
    } catch (err) {
      console.error(err);
      return interaction.editReply('API 조회 실패: 입력한 새 닉네임과 태그를 확인해주세요.');
    }

    // 3️⃣ members 객체 업데이트
    member.name  = gameName;
    member.tag   = tagLine;
    member.puuid = puuid;

    // 4️⃣ members.js 파일 저장
    fs.writeFileSync(
      membersPath,
      `/**\n * 사용자 목록\n */\nmodule.exports = ${JSON.stringify(members, null, 2)};\n`,
      'utf-8'
    );

    await interaction.editReply(`✅ ${oldName}#${oldTag} → ${gameName}#${tagLine} 변경 완료!`);
  }
};