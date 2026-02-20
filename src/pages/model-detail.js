// OllaManager - Model Detail Page
import { showModel, formatBytes } from '../api.js';
import { createSkeleton, createToast } from '../components.js';

export async function renderModelDetail(container, modelName) {
    container.innerHTML = `
    <div style="margin-bottom:var(--sp-4)">
      <a href="#/models" class="btn btn-ghost" style="gap:var(--sp-2)">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 2L4 8l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Back to Models
      </a>
    </div>
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div class="card-header">
        <h2 class="card-title" id="detail-model-name">${decodeURIComponent(modelName)}</h2>
        <a href="#/chat?model=${modelName}" class="btn btn-primary btn-sm">💬 Chat with this model</a>
      </div>
      <div id="detail-content">${createSkeleton(24, '100%', 8)}</div>
    </div>
    <div class="card" id="detail-extra" style="display:none">
      <div class="card-header">
        <h2 class="card-title">Template & System Prompt</h2>
      </div>
      <div id="detail-template-content"></div>
    </div>
    <div class="card" id="detail-license-card" style="display:none;margin-top:var(--sp-4)">
      <div class="card-header">
        <h2 class="card-title">License</h2>
      </div>
      <div id="detail-license-content" style="font-size:var(--text-sm);color:var(--text-secondary);white-space:pre-wrap;max-height:300px;overflow-y:auto;font-family:var(--font-mono)"></div>
    </div>
  `;

    try {
        const data = await showModel(decodeURIComponent(modelName));

        const detailContent = document.getElementById('detail-content');
        detailContent.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Model Family</div>
          <div class="detail-value">${data.details?.family || '—'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Format</div>
          <div class="detail-value">${data.details?.format || '—'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Parameter Size</div>
          <div class="detail-value">${data.details?.parameter_size || '—'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Quantization</div>
          <div class="detail-value"><span class="badge accent">${data.details?.quantization_level || '—'}</span></div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Families</div>
          <div class="detail-value">${(data.details?.families || []).map(f => `<span class="badge">${f}</span>`).join(' ') || '—'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Parent Model</div>
          <div class="detail-value">${data.details?.parent_model || '—'}</div>
        </div>
      </div>
      ${data.modelinfo ? `
        <div style="margin-top:var(--sp-5);padding-top:var(--sp-4);border-top:1px solid var(--border)">
          <div class="detail-label" style="margin-bottom:var(--sp-3)">Model Parameters</div>
          <div class="table-container">
            <table>
              <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
              <tbody>
                ${Object.entries(data.modelinfo || {}).slice(0, 15).map(([k, v]) => `
                  <tr>
                    <td style="font-family:var(--font-mono);font-size:var(--text-sm)">${k}</td>
                    <td style="font-size:var(--text-sm)">${typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

        // Template / System prompt section
        if (data.template || data.system) {
            const extraCard = document.getElementById('detail-extra');
            extraCard.style.display = 'block';
            document.getElementById('detail-template-content').innerHTML = `
        ${data.system ? `
          <div style="margin-bottom:var(--sp-4)">
            <div class="detail-label" style="margin-bottom:var(--sp-2)">System Prompt</div>
            <pre style="background:var(--bg-primary);padding:var(--sp-4);border-radius:var(--radius-md);font-size:var(--text-sm);overflow-x:auto;color:var(--text-secondary);max-height:200px;overflow-y:auto">${escapeHtml(data.system)}</pre>
          </div>
        ` : ''}
        ${data.template ? `
          <div>
            <div class="detail-label" style="margin-bottom:var(--sp-2)">Chat Template</div>
            <pre style="background:var(--bg-primary);padding:var(--sp-4);border-radius:var(--radius-md);font-size:var(--text-sm);overflow-x:auto;color:var(--text-secondary);max-height:200px;overflow-y:auto">${escapeHtml(data.template)}</pre>
          </div>
        ` : ''}
      `;
        }

        // License section
        if (data.license) {
            document.getElementById('detail-license-card').style.display = 'block';
            document.getElementById('detail-license-content').textContent = data.license;
        }
    } catch (err) {
        document.getElementById('detail-content').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load model details</h3>
        <p>${err.message}</p>
      </div>
    `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
