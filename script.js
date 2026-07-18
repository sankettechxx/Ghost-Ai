const BACKEND_URL = 'https://ai-api-1-ycot.onrender.com';
let currentChatId = Date.now();
const chats = {};

const chatBox = document.getElementById('chatBox');
const promptInput = document.getElementById('promptInput');
const chatHistoryEl = document.getElementById('chatHistory');

// Auto-resize textarea
promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 180) + 'px';
});

// Send message
async function sendMessage() {
    const message = promptInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    promptInput.value = '';
    promptInput.style.height = 'auto';

    if (!chats[currentChatId]) chats[currentChatId] = [];
    chats[currentChatId].push({ role: 'user', content: message });

    showTypingIndicator();

    try {
        const model = document.getElementById('modelSelect')?.value || 'smart';
        const res = await fetch(BACKEND_URL + '/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message, model: model })
        });

        const data = await res.json();
        removeTypingIndicator();

        const botReply = data.success ? data.response : 'Error: ' + (data.error || 'Unknown');
        chats[currentChatId].push({ role: 'assistant', content: botReply });
        addMessage(botReply, 'bot', true);
        saveToHistory();
    } catch (err) {
        removeTypingIndicator();
        addMessage('❌ Connection error. Is backend running?', 'bot');
    }
}

function addMessage(text, type, markdown = false) {
    const msg = document.createElement('div');
    msg.className = 'message ' + type;
    
    const content = document.createElement('div');
    content.className = 'msg-content';
    
    if (markdown && type === 'bot') {
        content.innerHTML = marked.parse(text);
        content.querySelectorAll('pre code').forEach(block => {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.onclick = () => {
                navigator.clipboard.writeText(block.textContent);
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            };
            block.parentElement.style.position = 'relative';
            block.parentElement.appendChild(btn);
        });
    } else {
        content.textContent = text;
    }
    
    msg.appendChild(content);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.id = 'typing';
    typing.className = 'message bot';
    typing.innerHTML = '<div class="msg-content"><i>Ghost is thinking...</i></div>';
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typing');
    if (typing) typing.remove();
}

function newChat() {
    currentChatId = Date.now();
    chatBox.innerHTML = `
        <div class="welcome">
            <h1>👻 Hello, I'm Ghost AI</h1>
            <p>Powered by Groq · Free · Fast</p>
            <div class="suggestions">
                <div class="suggestion" onclick="quickAsk('Write a Python hello world')">🐍 Write Python code</div>
                <div class="suggestion" onclick="quickAsk('Explain quantum computing')">🔮 Explain concepts</div>
                <div class="suggestion" onclick="quickAsk('Tell me a joke')">😄 Tell a joke</div>
            </div>
        </div>
    `;
    saveToHistory();
}

function quickAsk(text) {
    promptInput.value = text;
    sendMessage();
}

function saveToHistory() {
    chatHistoryEl.innerHTML = '';
    Object.keys(chats).slice(-10).forEach(id => {
        const item = document.createElement('div');
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        item.textContent = chats[id][0]?.content?.substring(0, 40) || 'New Chat';
        item.onclick = () => loadChat(id);
        chatHistoryEl.appendChild(item);
    });
}

function loadChat(id) {
    currentChatId = id;
    chatBox.innerHTML = '';
    (chats[id] || []).forEach(msg => {
        addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot', msg.role === 'assistant');
    });
    saveToHistory();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function toggleSettings() {
    document.getElementById('settingsModal').classList.toggle('show');
}

function closeModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

function saveSettings() {
    const model = document.getElementById('modelSelect').value;
    const badge = document.getElementById('modelBadge');
    const names = { smart: '🧠 Llama 3.3 70B', fast: '⚡ Llama 3.1 8B', mixtral: '🔮 Mixtral 8x7B' };
    badge.textContent = names[model] || '🧠 Llama 3.3 70B';
    closeModal();
}

promptInput.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChat();
