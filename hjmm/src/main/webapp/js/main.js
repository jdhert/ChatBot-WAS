const autoResponses = {
    '서버': 'CS:GO 서버 관련 문의이시군요. 현재 모든 서버는 정상 운영 중입니다. 특정 서버에 접속 문제가 있으시면 서버명과 오류 메시지를 알려주세요.',
    '버그': '버그 제보 감사합니다. 발견하신 버그에 대한 상세한 설명(발생 시점, 재현 방법 등)을 제공해주시면 빠르게 수정하겠습니다.',
    '계정': '계정 관련 문의는 보안을 위해 고객센터(jhkim10@covision.co.kr)로 직접 연락 부탁드립니다. 계정 정보는 채팅으로 공유하지 마세요.',
    '업데이트': '최신 업데이트는 3월 10일에 배포되었습니다. 주요 변경사항은 밸런스 조정 및 버그 수정입니다. 상세 내용은 패치노트를 확인해주세요.',
    '오류': '오류가 발생하셨군요. 오류 코드와 발생 상황을 자세히 설명해주시면 해결 방법을 안내해드리겠습니다.',
    '수아': '수아는 DB를 만지는 사람입니다. ',
    '현정': '네 이놈!!!!!!!!!!!!!!!!!!!! 어디 현정 마마의 이름을 입에 올리느냐!!!!! 무엄하다!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ',
    'default': '문의해주셔서 감사합니다. 귀하의 질문을 분석 중입니다. 보다 정확한 답변을 위해 구체적인 상황을 설명해주시면 도움이 됩니다. 추가 지원이 필요하시면 jhkim10@covision.co.kr으로 연락주세요.'
};

let isTyping = false;

function getAutoResponse(question) {
    const lowerQuestion = question.toLowerCase();
    
    for (const [keyword, response] of Object.entries(autoResponses)) {
        if (keyword !== 'default' && lowerQuestion.includes(keyword)) {
            return response;
        }
    }
    
    return autoResponses.default;
}

function formatTime(date) {
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function addMessage(text, isUser) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    
    const time = formatTime(new Date());
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const messagesDiv = document.getElementById('messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'message bot';
    
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span style="font-size: 14px;">답변 생성 중...</span>
        </div>
    `;
    
    messagesDiv.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

function scrollToBottom() {
    const chatArea = document.getElementById('chatArea');
    chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
    const inputBox = document.getElementById('inputBox');
    const sendButton = document.getElementById('sendButton');
    const text = inputBox.value.trim();
    
    if (!text || isTyping) return;
    
    addMessage(text, true);
    inputBox.value = '';
    inputBox.style.height = 'auto';
    
    isTyping = true;
    sendButton.disabled = true;
    showTypingIndicator();
    
	$.ajax({
	    url: 'http://localhost:3101/chat',
	    type: 'POST',    
	    contentType: 'application/json; charset=utf-8',
	    data:JSON.stringify({ 
						        query: text,
						        retriveScope: 'scc' 
    						}),
	    dataType: 'json',           
	    success: function(data) {   
	        hideTypingIndicator();
	        
	        console.log("--- 서버에서 받은 데이터 ---");
            console.log("전체 응답:", data);

			const answerText = data.generatedAnswer || data.message || '답변이 없습니다.';

            let sccIdText = '';
            if (Array.isArray(data.candidates) && data.candidates.length > 0) {
                const sccIds = [...new Set(
                    data.candidates
                        .map(item => item.sccId)
                        .filter(sccId => sccId !== null && sccId !== undefined && sccId !== '')
                )];

                if (sccIds.length > 0) {
                    sccIdText = '\n\n[SCC ID 목록]\n' + sccIds.join('\n');
                }
            }

            const serverResponse = answerText + sccIdText;

            addMessage(serverResponse, false);

            isTyping = false;
            sendButton.disabled = false;
	    },
	    error: function() {
			hideTypingIndicator();

            console.log('--- 서버 통신 실패 ---');
            console.log('status:', status);
            console.log('error:', error);
            console.log('responseText:', xhr.responseText);

            addMessage('서버와의 통신에 실패했습니다.', false);

            isTyping = false;
            sendButton.disabled = false;
	    }
	});
}

// 초기 메시지
addMessage('안녕하세요! CS:GO 유지보수 자동 답변 만들기 시스템입니다. 원하는 분야를 검색해보세요...', false);

// 이벤트 리스너
document.getElementById('sendButton').addEventListener('click', sendMessage);

document.getElementById('inputBox').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// textarea 자동 높이 조절
document.getElementById('inputBox').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

