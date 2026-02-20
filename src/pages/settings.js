// OllaManager - Settings Page
import { getBaseUrl, checkConnection, getVersion, saveSettings } from '../api.js';
import { createToast } from '../components.js';
import { renderSetupInstructions, getOriginDomain } from '../setup-instructions.js';

export async function renderSettings(container) {
  const currentUrl = getBaseUrl();
  const domain = getOriginDomain();

  container.innerHTML = `
    <div class="settings-layout">
      <div class="settings-main">
        <div class="card">
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

        <div class="card" style="margin-top:var(--sp-4)">
          <div class="card-header">
            <h2 class="card-title">🔧 Setup Guide</h2>
          </div>
          <div style="color:var(--text-secondary);font-size:var(--text-base);line-height:1.8">
            ${renderSetupInstructions('full')}
          </div>
        </div>
      </div>

      <aside class="settings-aside">
        <div class="card support-card support-card-side">
          <div class="support-heart-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-8-5.5-8-11c0-3.5 2.5-5.5 5-4 1.2.7 2.2 2 3 3 .8-1 1.8-2.3 3-3 2.5-1.5 5 .5 5 4 0 5.5-8 11-8 11z" fill="url(#heart-grad)"/>
              <defs>
                <linearGradient id="heart-grad" x1="4" y1="6" x2="20" y2="21">
                  <stop stop-color="#f43f5e"/>
                  <stop offset="1" stop-color="#ec4899"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h3 style="font-size:var(--text-md);font-weight:600;margin-bottom:var(--sp-1)">Support OllaManager</h3>
          <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.5;margin-bottom:var(--sp-4)">
            If this tool saves you time, consider buying me a coffee. It helps keep the project free & maintained! ☕
          </p>
          <a href="https://buymeacoffee.com/freeznet2012" target="_blank" rel="noopener noreferrer" class="btn btn-donate" style="width:100%;justify-content:center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14s-5.5-3.5-5.5-7.5C2.5 4 4.5 2.5 6 3.5 7 4.2 7.7 5 8 5.5c.3-.5 1-1.3 2-2C11.5 2.5 13.5 4 13.5 6.5 13.5 10.5 8 14 8 14z" fill="currentColor"/></svg>
            Buy Me a Coffee
          </a>
        </div>
      </aside>
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
