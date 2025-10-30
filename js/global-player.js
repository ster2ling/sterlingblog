// Global audio player that persists playback across pages.
(function () {
  const STORAGE_KEY = 'globalAudioState';
  const CHANNEL = 'globalAudioChannel';

  let audioEl = null;
  let ignoreStorage = false;

  function ensureAudio() {
    if (audioEl) return audioEl;
    audioEl = document.createElement('audio');
    audioEl.id = 'global-audio-player';
    audioEl.style.position = 'fixed';
    audioEl.style.bottom = '-1000px';
    audioEl.style.left = '-1000px';
    audioEl.preload = 'metadata';
    document.body.appendChild(audioEl);
    audioEl.addEventListener('timeupdate', saveStateThrottled);
    return audioEl;
  }

  function getState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    try {
      ignoreStorage = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      ignoreStorage = false;
    } catch (_) {}
  }

  let lastSave = 0;
  function saveStateThrottled() {
    const now = Date.now();
    if (now - lastSave < 500) return; // throttle
    lastSave = now;
    const a = audioEl;
    if (!a) return;
    const current = getState();
    saveState({
      ...current,
      currentTime: a.currentTime || 0,
      volume: a.volume || 1,
    });
  }

  function applyState(state) {
    if (!state || !state.src) return;
    const a = ensureAudio();
    if (a.src !== state.src) {
      a.src = state.src;
    }
    if (typeof state.volume === 'number') {
      a.volume = state.volume;
    }
    if (typeof state.currentTime === 'number') {
      a.currentTime = state.currentTime;
    }
    if (state.isPlaying) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }

  // React to storage changes from basement page
  window.addEventListener('storage', (e) => {
    if (ignoreStorage) return;
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        applyState(state);
      } catch (_) {}
    }
  });

  // Initialize on load
  document.addEventListener('DOMContentLoaded', function () {
    applyState(getState());
  });
})();


