// OllaManager - Reusable UI Components

export function createToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
    };

    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

export function showModal(title, body, actions) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');

    modal.innerHTML = `
    <h2 class="modal-title">${title}</h2>
    <div class="modal-body">${body}</div>
    <div class="modal-actions" id="modal-actions"></div>
  `;

    const actionsContainer = modal.querySelector('#modal-actions');
    actions.forEach(({ label, className, onClick }) => {
        const btn = document.createElement('button');
        btn.className = `btn ${className || 'btn-secondary'}`;
        btn.textContent = label;
        btn.addEventListener('click', () => {
            onClick();
            hideModal();
        });
        actionsContainer.appendChild(btn);
    });

    overlay.style.display = 'flex';

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
    }, { once: true });
}

export function hideModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

export function createProgressBar(percent = 0, label = '') {
    return `
    <div class="pull-progress">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:var(--text-sm);color:var(--text-secondary)">${label}</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary);font-family:var(--font-mono)">${Math.round(percent)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${percent}%"></div>
      </div>
    </div>
  `;
}

export function createSkeleton(height = 20, width = '100%', count = 1) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton" style="height:${height}px;width:${width};margin-bottom:8px;"></div>`;
    }
    return html;
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Simple markdown-to-HTML for chat bubbles
export function renderMarkdown(text) {
    let html = escapeHtml(text);

    // Code blocks (```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}
