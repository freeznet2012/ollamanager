// OllaManager - Settings Page
import { getBaseUrl, checkConnection, getVersion, saveSettings } from '../api.js';
import { createToast } from '../components.js';
import { renderSetupInstructions, getOriginDomain } from '../setup-instructions.js';

export async function renderSettings(container) {
  const currentUrl = getBaseUrl();
  const domain = getOriginDomain();

  container.innerHTML = `
    <div class="card" style="max-width:720px">
      <div class="card-header">
        <h2 class="card-title">⚙️ Connection Settings</h2>
      </div>

      <div style="margin-bottom:var(--sp-6)">
        <label style="display:block;font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-2);font-weight:500">
          Ollama Server URL
        </label>
        <div class="input-group">
          <input class="input" id="settings-url" type="url" value="${currentUrl}" placeholder="http://localhost:11434" />
          <button class="btn btn-secondary" id="test-connection-btn">Test Connection</button>
          <button class="btn btn-primary" id="save-settings-btn">Save</button>
        </div>
        <div id="test-result" style="margin-top:var(--sp-3);font-size:var(--text-sm)"></div>
      </div>

      ${domain ? `
        <div style="padding:12px 16px;background:var(--info-bg);border:1px solid rgba(59,130,246,0.2);border-radius:var(--radius-md);margin-bottom:var(--sp-4);font-size:var(--text-sm)">
          🔒 CORS origin for this site: <code style="background:var(--bg-surface-active);padding:2px 6px;border-radius:3px;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--accent-primary-hover)">${domain}</code>
        </div>
      ` : ''}
    </div>

    <div class="card" style="max-width:720px;margin-top:var(--sp-4)">
      <div class="card-header">
        <h2 class="card-title">🔧 Setup Guide</h2>
      </div>
      <div style="color:var(--text-secondary);font-size:var(--text-base);line-height:1.8">
        ${renderSetupInstructions('full')}
      </div>
    </div>
  `;

  // Test connection
  document.getElementById('test-connection-btn').addEventListener('click', async () => {
    const url = document.getElementById('settings-url').value.trim();
    const resultEl = document.getElementById('test-result');

    if (!url) {
      resultEl.innerHTML = `<span style="color:var(--danger)">⚠️ Please enter a URL</span>`;
      return;
    }

    resultEl.innerHTML = `<span style="color:var(--text-secondary)">⏳ Testing connection to ${url}...</span>`;

    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const modelCount = data.models?.length || 0;

        let versionText = '';
        try {
          const vRes = await fetch(`${url.replace(/\/+$/, '')}/api/version`, { signal: AbortSignal.timeout(3000) });
          if (vRes.ok) {
            const vData = await vRes.json();
            versionText = ` · Ollama v${vData.version}`;
          }
        } catch { /* ignore */ }

        resultEl.innerHTML = `<span style="color:var(--success)">✅ Connected successfully! Found ${modelCount} model(s)${versionText}</span>`;
      } else {
        resultEl.innerHTML = `<span style="color:var(--danger)">❌ Server responded with status ${res.status}</span>`;
      }
    } catch (err) {
      let hint = '';
      if (err.name === 'TypeError') {
        hint = `<br><span style="color:var(--warning);font-size:var(--text-xs)">💡 This is likely a CORS issue. Make sure Ollama is running with <code>OLLAMA_ORIGINS=${domain || '*'}</code> — see the setup guide below.</span>`;
      } else if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        hint = '<br><span style="color:var(--warning);font-size:var(--text-xs)">💡 Connection timed out. Make sure Ollama is running — see Step 2 in the guide below.</span>';
      }
      resultEl.innerHTML = `<span style="color:var(--danger)">❌ Cannot connect: ${err.message}${hint}</span>`;
    }
  });

  // Save settings
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const url = document.getElementById('settings-url').value.trim();
    if (!url) {
      createToast('Please enter a valid URL', 'error');
      return;
    }
    saveSettings({ baseUrl: url });
    createToast('Settings saved! Reconnecting...', 'success');
    window.dispatchEvent(new Event('settings-changed'));
  });
}
