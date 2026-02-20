// OllaManager - Dashboard Page
import { getModels, getRunningModels, formatBytes, timeAgo } from '../api.js';
import { createSkeleton } from '../components.js';

export async function renderDashboard(container) {
    container.innerHTML = `
    <div class="stats-grid" id="stats-grid">
      ${createSkeleton(100, '100%', 4)}
    </div>
    <div class="section-header">
      <h2 class="section-title">Running Models</h2>
    </div>
    <div id="running-models">${createSkeleton(70, '100%', 2)}</div>
    <div class="section-header" style="margin-top:var(--sp-6)">
      <h2 class="section-title">Installed Models</h2>
      <a href="#/models" class="btn btn-secondary btn-sm">View All →</a>
    </div>
    <div id="installed-models-preview">${createSkeleton(60, '100%', 3)}</div>
  `;

    try {
        const [models, running] = await Promise.all([getModels(), getRunningModels()]);

        const totalSize = models.reduce((sum, m) => sum + (m.size || 0), 0);
        const totalVram = running.reduce((sum, m) => sum + (m.size_vram || 0), 0);

        // Stats cards
        document.getElementById('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M7 8h8M7 11h8M7 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${models.length}</div>
          <div class="stat-label">Installed Models</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M11 7v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${running.length}</div>
          <div class="stat-label">Running Models</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 18V8l7-4 7 4v10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 8l7 4 7-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 12v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${formatBytes(totalSize)}</div>
          <div class="stat-label">Total Disk Usage</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="6" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 10h2v2H7zM11 10h2v2h-2z" fill="currentColor" opacity="0.5"/></svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">${formatBytes(totalVram)}</div>
          <div class="stat-label">VRAM Usage</div>
        </div>
      </div>
    `;

        // Running models
        const runningContainer = document.getElementById('running-models');
        if (running.length === 0) {
            runningContainer.innerHTML = `
        <div class="empty-state" style="padding:var(--sp-8)">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="currentColor" stroke-width="2"/><path d="M15 20h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <h3>No models running</h3>
          <p>Start a chat to load a model into memory</p>
        </div>
      `;
        } else {
            runningContainer.innerHTML = running.map(m => `
        <div class="running-model">
          <div class="stat-icon green" style="width:38px;height:38px;">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M9 6v3l2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="running-model-info">
            <div class="running-model-name">${m.name}</div>
            <div class="running-model-meta">
              <span>📐 ${m.details?.parameter_size || '—'}</span>
              <span>📦 VRAM: ${formatBytes(m.size_vram || 0)}</span>
              <span>📏 Context: ${(m.context_length || 0).toLocaleString()}</span>
              ${m.expires_at ? `<span>⏱️ Expires: ${timeAgo(m.expires_at)}</span>` : ''}
            </div>
          </div>
          <a href="#/chat" class="btn btn-primary btn-sm">Chat →</a>
        </div>
      `).join('');
        }

        // Installed models preview (first 5)
        const preview = models.slice(0, 5);
        const previewContainer = document.getElementById('installed-models-preview');
        if (models.length === 0) {
            previewContainer.innerHTML = `
        <div class="empty-state" style="padding:var(--sp-8)">
          <h3>No models installed</h3>
          <p>Go to the Models page to pull your first model</p>
          <a href="#/models" class="btn btn-primary" style="margin-top:var(--sp-4)">Browse Models →</a>
        </div>
      `;
        } else {
            previewContainer.innerHTML = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Family</th>
                <th>Size</th>
                <th>Parameters</th>
                <th>Quantization</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              ${preview.map(m => `
                <tr style="cursor:pointer" onclick="location.hash='#/model/${encodeURIComponent(m.name)}'">
                  <td><strong>${m.name}</strong></td>
                  <td><span class="badge">${m.details?.family || '—'}</span></td>
                  <td>${formatBytes(m.size)}</td>
                  <td>${m.details?.parameter_size || '—'}</td>
                  <td><span class="badge accent">${m.details?.quantization_level || '—'}</span></td>
                  <td style="color:var(--text-secondary)">${timeAgo(m.modified_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
        }
    } catch (err) {
        container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="var(--danger)" stroke-width="2"/><path d="M24 16v10M24 30v2" stroke="var(--danger)" stroke-width="2" stroke-linecap="round"/></svg>
        <h3>Cannot connect to Ollama</h3>
        <p>Make sure Ollama is running on <code>localhost:11434</code></p>
        <button class="btn btn-primary" style="margin-top:var(--sp-4)" onclick="location.reload()">Retry</button>
      </div>
    `;
    }
}
