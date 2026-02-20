// OllaManager - Models Library Page
import { getModels, pullModel, deleteModel, formatBytes, timeAgo } from '../api.js';
import { createToast, showModal, createSkeleton } from '../components.js';

let allModels = [];
let pullInProgress = false;

export async function renderModels(container) {
    container.innerHTML = `
    <div class="pull-section">
      <div class="pull-section-title">⬇️ Pull a New Model</div>
      <div class="input-group">
        <input class="input" id="pull-model-input" type="text" placeholder="Enter model name (e.g., llama3, gemma3, mistral, qwen3)" />
        <button class="btn btn-primary" id="pull-model-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 7l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12v2h12v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Pull
        </button>
      </div>
      <div id="pull-progress-area"></div>
    </div>

    <div class="search-section">
      <input class="search-input" id="model-search" type="text" placeholder="Search installed models..." />
    </div>

    <div class="section-header">
      <h2 class="section-title" id="models-count">Installed Models</h2>
    </div>

    <div class="models-grid" id="models-grid">
      ${createSkeleton(180, '100%', 6)}
    </div>
  `;

    // Pull model handler
    const pullBtn = document.getElementById('pull-model-btn');
    const pullInput = document.getElementById('pull-model-input');

    pullBtn.addEventListener('click', () => handlePull(pullInput.value.trim()));
    pullInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handlePull(pullInput.value.trim());
    });

    // Search handler
    document.getElementById('model-search').addEventListener('input', (e) => {
        renderModelCards(e.target.value.trim().toLowerCase());
    });

    // Load models
    await loadModels();
}

async function loadModels() {
    try {
        allModels = await getModels();
        renderModelCards('');
    } catch (err) {
        document.getElementById('models-grid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <h3>Failed to load models</h3>
        <p>Make sure Ollama is running</p>
      </div>
    `;
    }
}

function renderModelCards(filter) {
    const filtered = filter
        ? allModels.filter(m => m.name.toLowerCase().includes(filter))
        : allModels;

    const countEl = document.getElementById('models-count');
    countEl.textContent = `Installed Models (${filtered.length})`;

    const grid = document.getElementById('models-grid');

    if (filtered.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" stroke-width="2"/><path d="M18 20h12M18 24h12M18 28h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <h3>${filter ? 'No models match your search' : 'No models installed'}</h3>
        <p>${filter ? 'Try a different search term' : 'Pull a model using the form above'}</p>
      </div>
    `;
        return;
    }

    grid.innerHTML = filtered.map(m => `
    <div class="model-card" data-model="${m.name}">
      <div class="model-card-header">
        <div class="model-name">${m.name}</div>
      </div>
      <div class="model-meta">
        <span class="badge">${m.details?.family || 'unknown'}</span>
        <span class="badge accent">${m.details?.parameter_size || '—'}</span>
        <span class="badge">${m.details?.quantization_level || '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);color:var(--text-secondary)">
        <span>💾 ${formatBytes(m.size)}</span>
        <span>📅 ${timeAgo(m.modified_at)}</span>
      </div>
      <div class="model-card-actions">
        <a href="#/chat?model=${encodeURIComponent(m.name)}" class="btn btn-primary btn-sm" style="flex:1">
          💬 Chat
        </a>
        <a href="#/model/${encodeURIComponent(m.name)}" class="btn btn-secondary btn-sm" style="flex:1">
          🔍 Details
        </a>
        <button class="btn btn-danger btn-sm delete-model-btn" data-model="${m.name}" style="flex:0.5">
          🗑️
        </button>
      </div>
    </div>
  `).join('');

    // Attach delete handlers
    grid.querySelectorAll('.delete-model-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const name = btn.dataset.model;
            showModal(
                'Delete Model',
                `Are you sure you want to delete <strong>${name}</strong>? This action cannot be undone.`,
                [
                    { label: 'Cancel', className: 'btn-secondary', onClick: () => { } },
                    {
                        label: 'Delete',
                        className: 'btn-danger',
                        onClick: async () => {
                            try {
                                await deleteModel(name);
                                createToast(`Model "${name}" deleted successfully`, 'success');
                                await loadModels();
                            } catch (err) {
                                createToast(`Failed to delete "${name}": ${err.message}`, 'error');
                            }
                        },
                    },
                ]
            );
        });
    });
}

async function handlePull(name) {
    if (!name) {
        createToast('Please enter a model name', 'error');
        return;
    }
    if (pullInProgress) {
        createToast('A download is already in progress', 'error');
        return;
    }

    pullInProgress = true;
    const btn = document.getElementById('pull-model-btn');
    btn.disabled = true;
    btn.textContent = 'Pulling...';

    const progressArea = document.getElementById('pull-progress-area');
    progressArea.innerHTML = `
    <div style="margin-top:var(--sp-3)">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span class="pull-status" id="pull-status-text">Starting download...</span>
        <span style="font-size:var(--text-sm);color:var(--text-secondary);font-family:var(--font-mono)" id="pull-percent">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="pull-progress-fill" style="width:0%"></div>
      </div>
    </div>
  `;

    try {
        await pullModel(name, (data) => {
            const statusEl = document.getElementById('pull-status-text');
            const percentEl = document.getElementById('pull-percent');
            const fillEl = document.getElementById('pull-progress-fill');

            if (data.total && data.completed) {
                const pct = Math.round((data.completed / data.total) * 100);
                if (fillEl) fillEl.style.width = `${pct}%`;
                if (percentEl) percentEl.textContent = `${pct}%`;
            }
            if (data.status && statusEl) {
                statusEl.textContent = data.status;
            }
        });

        createToast(`Model "${name}" pulled successfully!`, 'success');
        progressArea.innerHTML = '';
        document.getElementById('pull-model-input').value = '';
        await loadModels();
    } catch (err) {
        createToast(`Failed to pull "${name}": ${err.message}`, 'error');
        progressArea.innerHTML = '';
    } finally {
        pullInProgress = false;
        btn.disabled = false;
        btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M4 7l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12v2h12v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      Pull
    `;
    }
}
