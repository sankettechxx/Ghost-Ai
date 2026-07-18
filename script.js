// ==================== CONFIG ====================
const BACKEND_URL = 'https://ai-api-1-ycot.onrender.com';
let currentChatId = Date.now().toString();
let chats = JSON.parse(localStorage.getItem('chats')) || {};

// ==================== DOM ELEMENTS ====================
const chatBox = document.getElementById('chatBox');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const chatHistory = document.getElementById('chatHistory');
const modelBadge = document.getElementById('modelBadge');

// ==================== MODEL MAPPING ====================
const modelMap = {
    "smart": "llama-3.3-70b-versatile",
    "fast": "llama-3.1-8b-instant",
    "mixtral": "mixtral-8x7b-32768"
};

let currentModel = "smart";

// ==================== FUNCTIONS ====================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function toggleSettings() {
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    currentModel = document.getElementById('modelSelect').value;
    const temp = parseFloat(document.getElementById('tempValue').textContent);
    
    modelBadge.textContent = currentModel === 'smart' ? 
        '🧠 Llama 3.3 70B' : currentModel === 'fast' ? 
        '⚡ Llama 3.1 8B' : '🔮 Mixtral 8x7B';
    
    closeModal();
}

async function sendMessage() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    // Add user message
    addMessage('user', prompt);
    promptInput.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        const res = await fetch(BACKEND_URL + '/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: prompt,
                model: modelMap[currentModel]
            })
        });

        const data = await res.json();

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (data.success) {
            addMessage('assistant', data.response);
        } else {
            addMessage('assistant', `❌ Error: ${data.error || 'Something went wrong'}`);
        }

    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('assistant', '❌ Connection error. Please try again.');
        console.error(error);
    }
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    if (role === 'assistant') {
        messageDiv.innerHTML = marked.parse(content);
    } else {
        messageDiv.textContent = content;
    }
    
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message assistant';
    typingDiv.innerHTML = `<i>Thinking...</i>`;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function quickAsk(text) {
    promptInput.value = text;
    sendMessage();
}

function newChat() {
    currentChatId = Date.now().toString();
    chatBox.innerHTML = `
        <div class="welcome">
            <h1>👻 Hello, I'm Ghost AI</h1>
            <p>Powered by Groq · Free · Fast</p>
            <div class="suggestions">
                <button class="suggestion" onclick="quickAsk('Write a Python hello world')">🐍 Write Python code</button>
                <button class="suggestion" onclick="quickAsk('Explain quantum computing simply')">🔮 Explain concepts</button>
                <button class="suggestion" onclick="quickAsk('Tell me a joke')">😄 Tell a joke</button>
            </div>
        </div>`;
}

// Enter key support
promptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto resize textarea
promptInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Load chat history (basic)
function loadChatHistory() {
    // You can enhance this later
    chatHistory.innerHTML = '<p style="color:#888; padding:10px;">No previous chats yet</p>';
}

// Initialize
window.onload = () => {
    loadChatHistory();
    promptInput.focus();
};
