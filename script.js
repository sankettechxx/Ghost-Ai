const BACKEND_URL = 'https://ai-api-1-ycot.onrender.com';
const chatBox = document.getElementById('chatBox');
const promptInput = document.getElementById('promptInput');
const loading = document.getElementById('loading');

async function sendMessage() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    
    // Add user message
    addMessage(prompt, 'user');
    promptInput.value = '';
    
    // Show loading
    loading.style.display = 'block';
    
    try {
        const res = await fetch(BACKEND_URL + '/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({prompt: prompt})
        });
        
        const data = await res.json();
        
        if (data.success) {
            addMessage(data.response, 'bot');
        } else {
            addMessage('❌ Error: ' + (data.error || 'Unknown'), 'bot');
        }
    } catch(e) {
        addMessage('❌ Connection failed. Please try again.', 'bot');
    }
    
    loading.style.display = 'none';
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'message ' + sender;
    msg.textContent = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter key to send
promptInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
