// OllaManager - Chat Page
import { getModels, chat, formatDuration } from '../api.js';
import { createToast, renderMarkdown } from '../components.js';

let chatHistory = [];
let isGenerating = false;
let currentModel = '';

export async function renderChat(container, params = {}) {
    container.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <select class="select" id="chat-model-select" style="min-width:200px">
          <option value="">Loading models...</option>
        </select>
        <button class="btn btn-secondary btn-sm" id="chat-clear-btn">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M4 4v7a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          Clear Chat
        </button>
        <div style="flex:1"></div>
        <div class="chat-stats" id="chat-stats"></div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="empty-state" id="chat-empty">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 12C8 10.895 8.895 10 10 10H38C39.105 10 40 10.895 40 12V30C40 31.105 39.105 32 38 32H18L12 38V32H10C8.895 32 8 31.105 8 30V12Z" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="24" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
            <circle cx="30" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
          </svg>
          <h3>Start a Conversation</h3>
          <p>Select a model and type a message to begin chatting</p>
        </div>
      </div>

      <div class="chat-input-area">
        <textarea id="chat-input" placeholder="Type a message... (Shift+Enter for new line)" rows="1"></textarea>
        <button class="chat-send-btn" id="chat-send-btn" disabled>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9L15 3L9 15L8 10L3 9Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="currentColor" fill-opacity="0.2"/></svg>
        </button>
      </div>
    </div>
  `;

    const select = document.getElementById('chat-model-select');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const clearBtn = document.getElementById('chat-clear-btn');

    // Load models into selector
    try {
        const models = await getModels();
        select.innerHTML = models.length
            ? models.map(m => `<option value="${m.name}" ${m.name === params.model ? 'selected' : ''}>${m.name} (${m.details?.parameter_size || ''})</option>`).join('')
            : '<option value="">No models installed</option>';

        currentModel = select.value;
        if (currentModel) sendBtn.disabled = false;
    } catch {
        select.innerHTML = '<option value="">Failed to load models</option>';
    }

    select.addEventListener('change', () => {
        currentModel = select.value;
        sendBtn.disabled = !currentModel;
    });

    // Auto-resize textarea
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    });

    // Send on Enter (Shift+Enter for newline)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating && currentModel && input.value.trim()) {
                sendMessage(input.value.trim());
            }
        }
    });

    sendBtn.addEventListener('click', () => {
        if (!isGenerating && currentModel && input.value.trim()) {
            sendMessage(input.value.trim());
        }
    });

    clearBtn.addEventListener('click', () => {
        chatHistory = [];
        const msgs = document.getElementById('chat-messages');
        msgs.innerHTML = `
      <div class="empty-state" id="chat-empty">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M8 12C8 10.895 8.895 10 10 10H38C39.105 10 40 10.895 40 12V30C40 31.105 39.105 32 38 32H18L12 38V32H10C8.895 32 8 31.105 8 30V12Z" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="24" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="30" cy="21" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>
        <h3>Start a Conversation</h3>
        <p>Select a model and type a message to begin chatting</p>
      </div>
    `;
        document.getElementById('chat-stats').textContent = '';
        createToast('Chat cleared', 'info');
    });
}

async function sendMessage(text) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const msgs = document.getElementById('chat-messages');

    // Remove empty state
    const empty = document.getElementById('chat-empty');
    if (empty) empty.remove();

    // Add user message
    chatHistory.push({ role: 'user', content: text });
    msgs.innerHTML += createMessageBubble('user', text);

    // Clear input
    input.value = '';
    input.style.height = 'auto';
    isGenerating = true;
    sendBtn.disabled = true;

    // Add assistant placeholder with typing indicator
    const assistantId = `msg-${Date.now()}`;
    msgs.innerHTML += `
    <div class="chat-message assistant" id="${assistantId}">
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
    scrollToBottom();

    let fullText = '';
    try {
        await chat(currentModel, chatHistory, (token, data) => {
            if (data?.finalStats) {
                // Show stats
                const statsEl = document.getElementById('chat-stats');
                if (statsEl) {
                    const tokPerSec = data.eval_count && data.eval_duration
                        ? ((data.eval_count / (data.eval_duration / 1e9))).toFixed(1)
                        : null;
                    statsEl.textContent = [
                        tokPerSec ? `${tokPerSec} tok/s` : '',
                        data.eval_count ? `${data.eval_count} tokens` : '',
                        data.total_duration ? `${formatDuration(data.total_duration)}` : '',
                    ].filter(Boolean).join(' · ');
                }
                return;
            }

            fullText += token;
            const bubble = document.querySelector(`#${assistantId} .chat-bubble`);
            if (bubble) {
                bubble.innerHTML = renderMarkdown(fullText);
            }
            scrollToBottom();
        });

        chatHistory.push({ role: 'assistant', content: fullText });
    } catch (err) {
        const bubble = document.querySelector(`#${assistantId} .chat-bubble`);
        if (bubble) {
            bubble.innerHTML = `<span style="color:var(--danger)">Error: ${err.message}</span>`;
        }
        createToast(`Chat error: ${err.message}`, 'error');
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

function createMessageBubble(role, content) {
    const avatar = role === 'user' ? 'U' : 'AI';
    const rendered = role === 'user' ? escapeHtmlSimple(content) : renderMarkdown(content);
    return `
    <div class="chat-message ${role}">
      <div class="chat-avatar">${avatar}</div>
      <div class="chat-bubble">${rendered}</div>
    </div>
  `;
}

function escapeHtmlSimple(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function scrollToBottom() {
    const msgs = document.getElementById('chat-messages');
    if (msgs) {
        requestAnimationFrame(() => {
            msgs.scrollTop = msgs.scrollHeight;
        });
    }
}
