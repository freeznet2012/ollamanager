// OllaManager – Main Entry Point & Router
import './style.css';

import { inject } from '@vercel/analytics';
inject();

import { checkConnection, getVersion, getSettings } from './api.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderModels } from './pages/models.js';
import { renderChat } from './pages/chat.js';
import { renderModelDetail } from './pages/model-detail.js';
import { renderSettings } from './pages/settings.js';
import { showModal, hideModal } from './components.js';

// ===== Router =====

const routes = {
  '/': { title: 'Dashboard', page: 'dashboard', render: renderDashboard },
  '/models': { title: 'Models', page: 'models', render: renderModels },
  '/chat': { title: 'Chat', page: 'chat', render: renderChat },
  '/settings': { title: 'Settings', page: 'settings', render: renderSettings },
};

function getHash() {
  return location.hash.slice(1) || '/';
}

function parseRoute(hash) {
  // /model/:name
  const modelMatch = hash.match(/^\/model\/(.+)$/);
  if (modelMatch) {
    return { title: 'Model Details', page: 'model-detail', modelName: modelMatch[1] };
  }

  // /chat?model=xxx
  const chatMatch = hash.match(/^\/chat/);
  if (chatMatch) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return { ...routes['/chat'], params: { model: params.get('model') } };
  }

  const basePath = hash.split('?')[0];
  return routes[basePath] || routes['/'];
}

async function navigate() {
  const hash = getHash();
  const route = parseRoute(hash);
  const content = document.getElementById('page-content');
  const title = document.getElementById('topbar-title');

  // Update title
  title.textContent = route.title;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === route.page);
  });

  // Render page
  if (route.page === 'model-detail') {
    await renderModelDetail(content, route.modelName);
  } else if (route.page === 'chat') {
    await renderChat(content, route.params || {});
  } else {
    await route.render(content);
  }
}

// ===== Welcome Modal (First Visit) =====

function showWelcomeModal() {
  const { isFirstVisit } = getSettings();
  if (!isFirstVisit) return;

  showModal(
    '👋 Welcome to OllaManager',
    `
      <p style="margin-bottom:12px">OllaManager connects to your <strong>local Ollama</strong> instance to manage models and chat with AI.</p>
      <p style="margin-bottom:12px">To get started, you need <strong>Ollama installed</strong> — <a href="https://ollama.com/download" target="_blank" rel="noopener" style="color:var(--accent-primary-hover);text-decoration:underline">Download here</a></p>
      <p style="font-size:13px;color:var(--text-tertiary)">Head to <strong>Settings</strong> for full setup instructions including CORS configuration.</p>
    `,
    [
      {
        label: 'Open Settings',
        className: 'btn-secondary',
        onClick: () => { location.hash = '#/settings'; },
      },
      {
        label: 'Got it, Continue',
        className: 'btn-primary',
        onClick: () => { },
      },
    ]
  );
}

// ===== Connection Monitor =====

async function updateConnectionStatus() {
  const badge = document.getElementById('connection-badge');
  const versionEl = document.getElementById('ollama-version');

  const connected = await checkConnection();
  const dot = badge.querySelector('.status-dot');
  const text = badge.querySelector('.status-text');

  if (connected) {
    dot.className = 'status-dot online';
    text.textContent = 'Connected';
    const version = await getVersion();
    if (version && versionEl) {
      versionEl.textContent = `Ollama v${version}`;
    }
  } else {
    dot.className = 'status-dot offline';
    text.textContent = 'Disconnected';
    if (versionEl) versionEl.textContent = '';
  }
}

// ===== Sidebar Toggle =====

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  const closeBtn = document.getElementById('sidebar-close');

  hamburger.addEventListener('click', () => {
    sidebar.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });
}

// ===== Init =====

async function init() {
  initSidebar();

  // Listen for hash changes
  window.addEventListener('hashchange', navigate);

  // Listen for settings changes (re-check connection)
  window.addEventListener('settings-changed', () => {
    updateConnectionStatus();
    // Re-render current page if on dashboard
    if (getHash() === '/') navigate();
  });

  // Initial render
  await navigate();

  // Check connection
  updateConnectionStatus();

  // Show welcome modal for first-time visitors
  showWelcomeModal();

  // Poll connection every 15 seconds
  setInterval(updateConnectionStatus, 15000);
}

init();
