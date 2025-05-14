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

    async function simulateResponse(userMessage) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const responses = [
            `좋은 질문이에요. "${userMessage}"에 대해 설명드릴게요.`,
            `"${userMessage}"은(는) 정말 흥미로운 주제예요.`,
            `음... "${userMessage}"에 대해 더 자세히 알려주시겠어요?`,
            `확인했습니다. "${userMessage}" 관련 정보를 찾아보겠습니다.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        const reply = await simulateResponse(message);
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