document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const modeToggle = document.getElementById('mode-toggle');

    function addMessage(content, isUser) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isUser ? 'user' : 'assistant'}`;
        messageEl.textContent = content;
        chatContainer.appendChild(messageEl);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function getChatGptReply(userMessage) {
        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await res.json();
            return data.reply;
        } catch (err) {
            return '서버와의 연결에 문제가 발생했습니다.';
        }
    }

    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // ChatGPT API로 대답 받기
        const reply = await getChatGptReply(message);
        addMessage(reply, false);
    }

    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;
    });

    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            // 다크 모드 토글
            document.body.classList.toggle('dark');

            // 현재 다크 모드 상태 확인
            const darkMode = document.body.classList.contains('dark');

            // 버튼 텍스트 업데이트
            modeToggle.textContent = darkMode ? '☀️ 라이트 모드' : '🌙 다크 모드';

            // 다크 모드 상태를 로컬 스토리지에 저장
            localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled');
        });

        // 페이지 로드 시 로컬 스토리지에서 다크 모드 상태를 확인하여 적용
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
       