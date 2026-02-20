// OllaManager - Setup Instructions Component
// Generates OS-specific setup commands with the correct origin domain

export function getOriginDomain() {
    const origin = window.location.origin;
    // If running locally, still show the wildcard since CORS isn't needed for localhost
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return null; // No CORS setup needed
    }
    return origin;
}

export function renderSetupInstructions(style = 'full') {
    const domain = getOriginDomain();
    const corsValue = domain || '*';
    const isLocal = !domain;

    if (style === 'compact') {
        return renderCompactInstructions(corsValue, isLocal);
    }
    return renderFullInstructions(corsValue, isLocal);
}

function renderCompactInstructions(corsValue, isLocal) {
    if (isLocal) {
        return `
      <div style="color:var(--text-secondary);font-size:var(--text-sm)">
        <p style="margin-bottom:8px">Make sure Ollama is running:</p>
        <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--success);overflow-x:auto">ollama serve</pre>
      </div>
    `;
    }

    return `
    <div style="color:var(--text-secondary);font-size:var(--text-sm)">
      <p style="margin-bottom:8px">Stop Ollama if running, then restart with CORS enabled for this site:</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div>
          <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🪟 Windows (PowerShell)</span>
          <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
$env:OLLAMA_ORIGINS="${corsValue}"; Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden</pre>
        </div>
        <div>
          <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🍎 macOS / 🐧 Linux</span>
          <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">pkill ollama 2>/dev/null; OLLAMA_ORIGINS=${corsValue} nohup ollama serve &>/dev/null &</pre>
        </div>
      </div>
    </div>
  `;
}

function renderFullInstructions(corsValue, isLocal) {
    return `
    <div style="display:flex;flex-direction:column;gap:20px">
      <!-- Step 1: Install -->
      <div>
        <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span class="badge accent" style="width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%">1</span>
          Install Ollama
        </h3>
        <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-left:30px">
          Download from <a href="https://ollama.com/download" target="_blank" rel="noopener" style="color:var(--accent-primary-hover);text-decoration:underline">ollama.com/download</a> if you haven't already.
        </p>
      </div>

      <!-- Step 2: Stop existing -->
      <div>
        <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span class="badge accent" style="width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%">2</span>
          Stop Ollama if already running
        </h3>
        <div style="margin-left:30px;display:flex;flex-direction:column;gap:8px">
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🪟 Windows (PowerShell)</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue</pre>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🪟 Windows (CMD)</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">taskkill /f /im ollama.exe</pre>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🍎 macOS</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">pkill ollama</pre>
            <p style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:4px">Or quit the Ollama app from the menu bar.</p>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🐧 Linux (systemd)</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">sudo systemctl stop ollama</pre>
          </div>
        </div>
      </div>

      <!-- Step 3: Restart with CORS -->
      <div>
        <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span class="badge accent" style="width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%">3</span>
          Restart with CORS enabled
          ${!isLocal ? '<span class="badge warning">Required</span>' : ''}
        </h3>
        ${!isLocal ? `
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-left:30px;margin-bottom:4px">
            Allowing access from: <code style="background:var(--bg-surface-active);padding:2px 6px;border-radius:3px;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--success)">${corsValue}</code>
          </p>
        ` : ''}
        <div style="margin-left:30px;display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🪟 Windows (PowerShell) — runs in background</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">$env:OLLAMA_ORIGINS="${corsValue}"; Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden</pre>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🪟 Windows (CMD) — runs in background</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">set OLLAMA_ORIGINS=${corsValue} && start /b ollama serve</pre>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🍎 macOS / 🐧 Linux (bash) — runs in background</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">OLLAMA_ORIGINS=${corsValue} nohup ollama serve &>/dev/null &</pre>
          </div>
          <div>
            <span style="font-size:var(--text-xs);color:var(--text-tertiary);font-weight:500">🐧 Linux (systemd) — permanent, survives reboot</span>
            <pre style="background:var(--bg-primary);padding:10px 14px;border-radius:8px;font-family:var(--font-mono);font-size:12px;color:var(--accent-primary-hover);overflow-x:auto;margin-top:4px">sudo systemctl edit ollama
# Add these lines:
[Service]
Environment="OLLAMA_ORIGINS=${corsValue}"
# Save, then:
sudo systemctl restart ollama</pre>
          </div>
        </div>
      </div>

      <!-- Tip -->
      <div style="font-size:var(--text-sm);color:var(--text-tertiary);padding:12px 16px;background:var(--bg-surface-hover);border-radius:8px;margin-top:4px">
        💡 <strong style="color:var(--text-secondary)">Using a different port or remote server?</strong>
        Go to <a href="#/settings" style="color:var(--accent-primary-hover);text-decoration:underline">Settings</a> to configure your Ollama URL.
      </div>
    </div>
  `;
}
