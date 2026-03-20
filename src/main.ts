import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';

// ── Global error handlers ─────────────────────────────────────────
// Catches uncaught exceptions and unhandled promise rejections.
// Shows a non-intrusive toast so users know something went wrong
// instead of seeing a blank screen or broken UI.

const ERROR_TOAST_ID = 'klavier-error-toast';
let errorToastTimeout: ReturnType<typeof setTimeout> | undefined;

function showErrorToast(message: string) {
  // Avoid stacking multiple toasts
  let toast = document.getElementById(ERROR_TOAST_ID);
  if (!toast) {
    toast = document.createElement('div');
    toast.id = ERROR_TOAST_ID;
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #3d3929; color: #fff; padding: 12px 20px; border-radius: 8px;
      font-family: 'Inter', system-ui, sans-serif; font-size: 0.85rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;
      display: flex; align-items: center; gap: 10px; max-width: 480px;
      opacity: 0; transition: opacity 0.2s ease;
    `;
    document.body.appendChild(toast);
    // Trigger fade-in
    requestAnimationFrame(() => { toast!.style.opacity = '1'; });
  } else {
    toast.style.opacity = '1';
  }

  toast.innerHTML = `
    <span style="flex:1">${message}</span>
    <button onclick="this.parentElement.style.opacity='0'; setTimeout(()=>this.parentElement.remove(),200)"
      style="background:none; border:none; color:#b4b2a7; cursor:pointer; font-size:1rem; padding:0 4px;">✕</button>
  `;

  // Auto-dismiss after 6 seconds
  clearTimeout(errorToastTimeout);
  errorToastTimeout = setTimeout(() => {
    if (toast) {
      toast.style.opacity = '0';
      setTimeout(() => toast?.remove(), 200);
    }
  }, 6000);
}

window.onerror = (message, _source, _lineno, _colno, _error) => {
  // Ignore benign browser extension errors and ResizeObserver noise
  const msg = String(message);
  if (msg.includes('ResizeObserver') || msg.includes('Script error')) return;

  console.error('[Klavier]', message);
  showErrorToast('Something went wrong. Try refreshing the page.');
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);

  // Audio context suspension is expected on first load (requires user interaction)
  if (msg.includes('AudioContext') || msg.includes('user gesture')) return;

  console.error('[Klavier] Unhandled promise rejection:', reason);
  showErrorToast('Something went wrong. Try refreshing the page.');
};

// ── App mount ─────────────────────────────────────────────────────
mount(App, { target: document.getElementById('app')! });
