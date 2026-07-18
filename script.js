const BACKEND_URL = 'https://ai-api-1-ycot.onrender.com';
let currentChatId = Date.now();
const chats = {};

const chatBox = document.getElementById('chatBox');
const promptInput = document.getElementById('promptInput');
const chatHistoryEl = document.getElementById('chatHistory');
const sendBtn = document.getElementById('sendBtn');

// Auto-resize textarea
promptInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 180) + 'px';
});

// ============ SEND MESSAGE ============
async function sendMessage() {
    const message = promptInput.value.trim();
    if (!message || sendBtn.disabled) return;

    addMessage(message, 'user');
    promptInput.value = '';
    promptInput.style.height = 'auto';
    sendBtn.disabled = true;

    if (!chats[currentChatId]) chats[currentChatId] = [];
    chats[currentChatId].push({ role: 'user', content: message });

    const botMsg = addMessage('', 'bot', true);
    const contentDiv = botMsg.querySelector('.msg-content');
    
    try {
        const model = document.getElementById('modelSelect')?.value || 'smart';
        const res = await fetch(BACKEND_URL + '/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message, model: model })
        });

        const data = await res.json();
        const reply = data.success ? data.response : '❌ Error: ' + (data.error || 'Unknown');
        
        // Simulate streaming (word by word)
        await streamText(contentDiv, reply);
        
        chats[currentChatId].push({ role: 'assistant', content: reply });
        addMessageActions(botMsg, reply);
        saveToHistory();
    } catch (err) {
        contentDiv.textContent = '❌ Connection error. Is backend running?';
    }
    
    sendBtn.disabled = false;
}

// ============ STREAMING EFFECT ============
async function streamText(element, text) {
    element.textContent = '';
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
        element.textContent += (i > 0 ? ' ' : '') + words[i];
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
    }
    
    // Add copy buttons to code blocks
    element.querySelectorAll('pre code').forEach(block => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = '📋 Copy';
        btn.onclick = () => {
            navigator.clipboard.writeText(block.textContent);
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = '📋 Copy', 2000);
        };
        block.parentElement.style.position = 'relative';
        block.parentElement.appendChild(btn);
    });
}

// ============ ADD MESSAGE ============
function addMessage(text, type, markdown = false) {
    const msg = document.createElement('div');
    msg.className = 'message ' + type;
    
    const content = document.createElement('div');
    content.className = 'msg-content';
    
    if (markdown && type === 'bot') {
        content.innerHTML = text ? marked.parse(text) : '';
    } else {
        content.textContent = text;
    }
    
    // Timestamp
    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    content.appendChild(time);
    
    msg.appendChild(content);
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return msg;
}

// ============ MESSAGE ACTIONS ============
function addMessageActions(msgDiv, text) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    
    // Copy
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Copy';
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => copyBtn.innerHTML = '<i class="fas fa-copy"></i>', 2000);
    };
    
    // Like
    const likeBtn = document.createElement('button');
    likeBtn.innerHTML = '<i class="fas fa-thumbs-up"></i>';
    likeBtn.title = 'Like';
    likeBtn.onclick = () => {
        likeBtn.classList.toggle('active');
        dislikeBtn.classList.remove('active');
    };
    
    // Dislike
    const dislikeBtn = document.createElement('button');
    dislikeBtn.innerHTML = '<i class="fas fa-thumbs-down"></i>';
    dislikeBtn.title = 'Dislike';
    dislikeBtn.onclick = () => {
        dislikeBtn.classList.toggle('active');
        likeBtn.classList.remove('active');
    };
    
    // Regenerate
    const regenBtn = document.createElement('button');
    regenBtn.innerHTML = '<i class="fas fa-redo"></i>';
    regenBtn.title = 'Regenerate';
    regenBtn.onclick = () => {
        msgDiv.remove();
        sendMessage();
    };
    
    actions.appendChild(copyBtn);
    actions.appendChild(likeBtn);
    actions.appendChild(dislikeBtn);
    actions.appendChild(regenBtn);
    
    msgDiv.querySelector('.msg-content').appendChild(actions);
}

// ============ HISTORY ============
function saveToHistory() {
    chatHistoryEl.innerHTML = '';
    const ids = Object.keys(chats).slice(-10).reverse();
    ids.forEach(id => {
        const item = document.createElement('div');
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        const firstMsg = chats[id]?.[0]?.content || 'New Chat';
        item.textContent = firstMsg.substring(0, 35);
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

function newChat() {
    currentChatId = Date.now();
    chatBox.innerHTML = `
        <div class="welcome">
            <h1>👻 Hello, I'm Ghost AI</h1>
            <p>Powered by Groq · Free · Fast</p>
            <div class="suggestions">
                <button class="suggestion" onclick="quickAsk('Write a Python hello world')">🐍 Write Python code</button>
                <button class="suggestion" onclick="quickAsk('Explain quantum computing simply')">🔮 Explain concepts</button>
                <button class="suggestion" onclick="quickAsk('Tell me a joke')">😄 Tell a joke</button>
            </div>
        </div>
    `;
    saveToHistory();
}

function quickAsk(text) {
    promptInput.value = text;
    sendMessage();
}

// ============ SETTINGS ============
function toggleSettings() {
    document.getElementById('settingsModal').classList.toggle('show');
}
function closeModal() {
    document.getElementById('settingsModal').classList.remove('show');
}
function saveSettings() {
    const model = document.getElementById('modelSelect').value;
    const names = { smart: '🧠 Llama 3.3 70B', fast: '⚡ Llama 3.1 8B', mixtral: '🔮 Mixtral 8x7B' };
    document.getElementById('modelBadge').textContent = names[model] || 'Smart';
    closeModal();
}

// ============ SIDEBAR ============
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============ KEYBOARD ============
promptInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ============ INIT ============
newChat();
