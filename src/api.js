// OllaManager - Ollama API Client
// Wraps all fetch calls to the local Ollama REST API

const DEFAULT_BASE_URL = 'http://localhost:11434';
const STORAGE_KEY = 'ollamanager_settings';

let baseUrl = DEFAULT_BASE_URL;

// Load saved settings on init
function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.baseUrl) baseUrl = settings.baseUrl;
    }
  } catch { /* ignore */ }
}
loadSettings();

export function setBaseUrl(url) {
  baseUrl = url.replace(/\/+$/, '');
}

export function getBaseUrl() {
  return baseUrl;
}

export function getSettings() {
  return {
    baseUrl,
    isFirstVisit: !localStorage.getItem(STORAGE_KEY),
  };
}

export function saveSettings(settings) {
  if (settings.baseUrl) {
    baseUrl = settings.baseUrl.replace(/\/+$/, '');
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl }));
}

// ===== Health & Version =====

export async function checkConnection() {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getVersion() {
  try {
    const res = await fetch(`${baseUrl}/api/version`);
    if (!res.ok) throw new Error('Failed to get version');
    const data = await res.json();
    return data.version || 'unknown';
  } catch {
    return null;
  }
}

// ===== Models =====

export async function getModels() {
  const res = await fetch(`${baseUrl}/api/tags`);
  if (!res.ok) throw new Error('Failed to fetch models');
  const data = await res.json();
  return data.models || [];
}

export async function getRunningModels() {
  const res = await fetch(`${baseUrl}/api/ps`);
  if (!res.ok) throw new Error('Failed to fetch running models');
  const data = await res.json();
  return data.models || [];
}

export async function showModel(name) {
  const res = await fetch(`${baseUrl}/api/show`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name }),
  });
  if (!res.ok) throw new Error(`Failed to show model: ${name}`);
  return await res.json();
}

export async function deleteModel(name) {
  const res = await fetch(`${baseUrl}/api/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name }),
  });
  if (!res.ok) throw new Error(`Failed to delete model: ${name}`);
  return true;
}

export async function pullModel(name, onProgress) {
  const res = await fetch(`${baseUrl}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: name, stream: true }),
  });

  if (!res.ok) throw new Error(`Failed to pull model: ${name}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          if (onProgress) onProgress(data);
        } catch { /* skip malformed JSON */ }
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer);
      if (onProgress) onProgress(data);
    } catch { /* skip */ }
  }
}

// ===== Chat =====

export async function chat(model, messages, onToken, options = {}) {
  const controller = new AbortController();

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...options,
    }),
    signal: controller.signal,
  });

  if (!res.ok) throw new Error(`Chat failed with model: ${model}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            fullResponse += data.message.content;
            if (onToken) onToken(data.message.content, data);
          }
          if (data.done && onToken) {
            onToken('', { ...data, fullResponse, finalStats: true });
          }
        } catch { /* skip */ }
      }
    }
  }

  return fullResponse;
}

// ===== Utilities =====

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDuration(ns) {
  if (!ns) return '—';
  const ms = ns / 1_000_000;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const remSec = Math.floor(sec % 60);
  return `${min}m ${remSec}s`;
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
