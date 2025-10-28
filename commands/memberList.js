const { SlashCommandBuilder } = require('discord.js');
const members = require('../data/members.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('클랜원목록')
    .setDescription('현재 등록된 모든 클랜원 목록을 보여줍니다.'),

  async execute(interaction) {
    // members.js가 배열 형태라고 가정
    if (!members || members.length === 0) {
      return interaction.reply({ content: '등록된 클랜원이 없습니다.', ephemeral: true });
    }

    // 이름#태그 형식으로 변환
    const formattedMembers = members
      .map(m => `${m.name}#${m.tag}`)
      .sort((a, b) => a.localeCompare(b)) // 가나다/알파벳 순 정렬
      .join('\n');

    // 보기 좋은 임베드 형식
    const embed = {
      color: 0x0099ff,
      title: '📜 클랜원 목록',
      description: '현재 등록된 클랜원입니다.',
      fields: [
        {
          name: `👥 총 ${members.length}명`,
          value: '```' + formattedMembers + '```',
        },
      ],
      timestamp: new Date(),
      footer: { text: 'Azit Clan Bot' },
    };

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};