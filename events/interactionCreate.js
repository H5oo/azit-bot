/*****************
 * 이벤트 핸들러
 *****************/

module.exports = {
  name: 'interactionCreate', // 이벤트 이름
  async execute(interaction, client) {
    // ===== 1️⃣ 슬래시 명령어 처리 =====
    if (interaction.isCommand()) {  // 슬래시 명령어인지 확인
      const command = client.commands.get(interaction.commandName); // 등록된 명령어 가져오기
      if (!command) return;  // 명령어가 존재하지 않으면 종료

      try {
        await command.execute(interaction); // 명령어 실행
      } catch (error) {
        console.error(error); // 에러 로그
        await interaction.reply({ 
          content: '명령어 실행 중 오류가 발생했습니다.', 
          ephemeral: true // 오류 메시지를 본인만 볼 수 있게
        });
      }
    } 
    
    // ===== 2️⃣ 버튼 클릭 처리 =====
    else if (interaction.isButton()) { // 버튼 클릭 이벤트인지 확인
      const [type, value] = interaction.customId.split('_');

      try {
        if (type === 'month') {
          const handler = require('../interactions/buttons/monthSelectHandler');
          await handler.execute(interaction, value);
        }
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: '버튼 처리 중 오류가 발생했습니다.',
          ephemeral: true,
        });
      }
    }
  },
};