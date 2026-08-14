document.addEventListener('DOMContentLoaded', function () {
    if (!requireAuth()) return;
});

function addChatMessage(text, type) {
    const container = document.getElementById('chatMessages');
    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-message ' + type;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = type === 'ai' ? '<i class="bi bi-robot"></i>' : '<i class="bi bi-person"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function addChatMessageHTML(html, type) {
    const container = document.getElementById('chatMessages');
    const welcome = container.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-message ' + type;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = type === 'ai' ? '<i class="bi bi-robot"></i>' : '<i class="bi bi-person"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = html;

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

async function sendQuery() {
    const input = document.getElementById('chatInput');
    const query = input.value.trim();
    if (!query) return;

    const btn = document.getElementById('sendBtn');
    btn.disabled = true;
    input.value = '';

    addChatMessage(query, 'user');
    addChatMessage('Thinking...', 'ai');

    try {
        const data = await apiRequest('/ai/query', {
            method: 'POST',
            body: JSON.stringify({ query: query })
        });

        const container = document.getElementById('chatMessages');
        const thinkingMsg = container.querySelector('.chat-message.ai:last-child .bubble');
        if (data) {
            let responseText = '';
            if (typeof data === 'string') {
                responseText = data;
            } else if (data.message) {
                responseText = data.message;
            } else if (data.data) {
                responseText = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
            } else {
                responseText = JSON.stringify(data, null, 2);
            }
            thinkingMsg.textContent = responseText;

            if (data.data) {
                showResultCard('AI Analysis', responseText);
            }
        } else {
            thinkingMsg.textContent = 'I received your query but could not generate a response. Please try again.';
        }
    } catch (error) {
        const container = document.getElementById('chatMessages');
        const thinkingMsg = container.querySelector('.chat-message.ai:last-child .bubble');
        thinkingMsg.textContent = 'Sorry, I encountered an error processing your request. Please try again.';
        console.error('AI query error:', error);
    } finally {
        btn.disabled = false;
        input.focus();
    }
}

async function runAIFeature(feature) {
    const btn = document.getElementById('sendBtn');
    btn.disabled = true;

    let featureQuery = '';
    let featureTitle = '';

    switch (feature) {
        case 'forecast':
            featureQuery = 'Show me the demand forecast for all products';
            featureTitle = 'Demand Forecast';
            break;
        case 'reorder':
            featureQuery = 'Show me reorder suggestions for low stock items';
            featureTitle = 'Reorder Suggestions';
            break;
        case 'anomalies':
            featureQuery = 'Detect any anomalies in the inventory';
            featureTitle = 'Anomaly Detection';
            break;
        case 'stock-health':
            featureQuery = 'Analyze the overall stock health';
            featureTitle = 'Stock Health Analysis';
            break;
    }

    addChatMessage(featureQuery, 'user');
    addChatMessage('Analyzing...', 'ai');

    let endpoint = '';
    switch (feature) {
        case 'forecast':
            endpoint = '/ai/forecast/1';
            break;
        case 'reorder':
            endpoint = '/ai/reorder-suggestions';
            break;
        case 'anomalies':
            endpoint = '/ai/anomalies';
            break;
        case 'stock-health':
            endpoint = '/ai/stock-health';
            break;
    }

    try {
        let data;
        if (feature === 'forecast') {
            const products = await apiRequest('/products');
            if (products && products.length > 0) {
                data = await apiRequest('/ai/forecast/' + products[0].id);
            }
        } else {
            data = await apiRequest(endpoint);
        }

        const container = document.getElementById('chatMessages');
        const thinkingMsg = container.querySelector('.chat-message.ai:last-child .bubble');

        if (data) {
            let responseText = '';
            if (typeof data === 'string') {
                responseText = data;
            } else if (data.message) {
                responseText = data.message;
            } else if (data.data) {
                responseText = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
            } else {
                responseText = JSON.stringify(data, null, 2);
            }
            thinkingMsg.textContent = responseText;
            showResultCard(featureTitle, responseText);
        } else {
            thinkingMsg.textContent = 'Unable to retrieve ' + featureTitle.toLowerCase() + ' at this time.';
        }
    } catch (error) {
        const container = document.getElementById('chatMessages');
        const thinkingMsg = container.querySelector('.chat-message.ai:last-child .bubble');
        thinkingMsg.textContent = 'Error fetching ' + featureTitle.toLowerCase() + '. Please try again.';
        console.error('AI feature error:', error);
    } finally {
        btn.disabled = false;
    }
}

function showResultCard(title, content) {
    const card = document.getElementById('aiResultCard');
    document.getElementById('aiResultTitle').innerHTML = '<i class="bi bi-robot"></i> ' + title;
    const contentEl = document.getElementById('aiResultContent');
    contentEl.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.textContent = content;
    contentEl.appendChild(pre);
    card.classList.add('active');
}
