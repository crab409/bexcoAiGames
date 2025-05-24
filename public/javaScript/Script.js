document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const modeToggle = document.getElementById('mode-toggle');

    // 엔터를 누르면 인풋 태그의 글이 사라지는 기능 + 서버에 메시지 전달
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = messageInput.value.trim(); // 입력된 메시지 가져오기
            if (message) {
                // 서버에 메시지 전달
                const sendButton = document.getElementById('send-button');
                sendButton.click(); // 전송 버튼 클릭 이벤트 트리거
            }
            messageInput.value = ''; // 입력 필드 초기화
        }
    });

    // 다크 모드/화이트 모드 기능
    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark'); // 다크 모드 토글

            const darkMode = document.body.classList.contains('dark');
            modeToggle.textContent = darkMode ? '☀️ 라이트 모드' : '🌙 다크 모드';

            localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled'); // 상태 저장
        });

        // 페이지 로드 시 저장된 다크 모드 상태 적용
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'enabled') {
            document.body.classList.add('dark');
            modeToggle.textContent = '☀️ 라이트 모드';
        } else {
            document.body.classList.remove('dark');
            modeToggle.textContent = '🌙 다크 모드';
        }
    }
});