/*****************
 * 아지트 월말정산
 * 해당 파일은 커맨드 입력 시 달력 버튼생성까지만
 *****************/

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let lastUsedTime = 0; // 서버 전체 쿨타임 기록

module.exports = {
  // 슬래시 명령어 정의
  data: new SlashCommandBuilder()
    .setName('월말정산')            // 명령어 이름
    .setDescription('월말정산 데이터를 확인합니다.'),  // 명령어 설명

  // 명령어 실행 시 호출되는 함수
  async execute(interaction) {
    // ===== 역할 기반 권한 체크 =====
    const allowedRoles  = process.env.ALLOWED_ROLES.split(',');
    const hasPermission = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));
    
    if (!hasPermission) {
      return interaction.reply({ content: '권한이 없습니다.', ephemeral: true });
    }

    const now = Date.now();
    const cooldownAmount = 3 * 60 * 1000; // 3분 = 180,000ms

    // 서버 전체 쿨타임 확인
    if (now - lastUsedTime < cooldownAmount) {
      const timeLeft = Math.ceil((cooldownAmount - (now - lastUsedTime)) / 1000);
      return interaction.reply({ 
        content: `잠시만 기다려주세요! ${timeLeft}초 후에 다시 사용할 수 있습니다.`, 
        ephemeral: true 
      });
    }

    // 쿨타임 갱신
    lastUsedTime = now;

    // ===== 1️⃣ 버튼 생성 =====
    // 버튼 1~12월 생성
    const rows = [];
    let currentRow = new ActionRowBuilder();

    for (let month = 1; month <= 12; month++) {
      // 버튼 생성
      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`month_${month}`)  // 클릭 시 식별용 ID
          .setLabel(`${month}월`)           // 버튼에 표시될 글자
          .setStyle(ButtonStyle.Primary)   // 파랑 버튼
      );

      // 4개 버튼마다 한 줄(row) 완성
      if (month % 4 === 0) {
        rows.push(currentRow);         // 완성된 row를 배열에 추가
        currentRow = new ActionRowBuilder(); // 새로운 row 생성
      }
    }

    // 남은 버튼(row) 처리 (12월 끝남)
    if (currentRow.components.length > 0) {
      rows.push(currentRow);
    }

    // ===== 2️⃣ 버튼 메시지 전송 =====
    // interaction.reply: 슬래시 명령어에 대한 답장
    // components: 버튼 배열 (ActionRowBuilder)
    await interaction.reply({ content: '월을 선택하세요:', components: rows });
  },
};