import { pwaCopy } from '../i18n/pwa';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function workerVersion(worker: ServiceWorker | null): Promise<string | null> {
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => finish(null), 3000);
    function finish(version: string | null) {
      clearTimeout(timer);
      channel.port1.close();
      resolve(version);
    }
    channel.port1.onmessage = (event) => finish(typeof event.data?.version === 'string' ? event.data.version : null);
    try { worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]); }
    catch { finish(null); }
  });
}

export function initPwa() {
  const root = document.querySelector<HTMLElement>('[data-pwa-root]');
  if (!root) return;
  const s = pwaCopy[root.dataset.lang === 'zh' ? 'zh' : 'en'];
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const displayMode = matchMedia('(display-mode: standalone)');
  const isApp = () => displayMode.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const installButton = document.querySelector<HTMLButtonElement>('[data-pwa-install]');
  const installSection = document.querySelector<HTMLElement>('[data-pwa-install-section]');
  const help = document.querySelector<HTMLDialogElement>('[data-pwa-help]');
  const updates = document.querySelector<HTMLElement>('[data-pwa-updates]');
  const versionLabel = document.querySelector<HTMLElement>('[data-pwa-version]');
  const checkButton = document.querySelector<HTMLButtonElement>('[data-pwa-check]');
  const result = document.querySelector<HTMLElement>('[data-pwa-check-result]');
  const updateNotice = document.querySelector<HTMLElement>('[data-pwa-update]');
  const applyButton = document.querySelector<HTMLButtonElement>('[data-pwa-apply]');
  const connectionNotice = document.querySelector<HTMLElement>('[data-pwa-connection]');
  const connectionText = document.querySelector<HTMLElement>('[data-pwa-connection-text]');
  const reloadButton = document.querySelector<HTMLButtonElement>('[data-pwa-reload]');
  let prompt: InstallPrompt | null = null;
  let installed = isApp();
  let registration: ServiceWorkerRegistration | null = null;
  let applying = false;
  let dirty = false;
  let checking = false;
  let lastCheck = 0;
  let dismissed = false;
  const pageVersion = document.querySelector<HTMLMetaElement>('meta[name="edustack-version"]')?.content;
  let activeVersion: string | null = null;
  let latestVersion: string | null = null;

  function syncDisplay() {
    if (installSection) installSection.hidden = installed || isApp();
    if (installButton) installButton.hidden = installed || isApp();
    if (updates) updates.hidden = !isApp();
    if (updateNotice && !isApp()) updateNotice.hidden = true;
  }
  syncDisplay();
  displayMode.addEventListener('change', syncDisplay);

  // External resources leave the app's navigation context, on the user's click.
  function prepareExternalLink(link: HTMLAnchorElement) {
    const url = new URL(link.href, location.href);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin === location.origin) return;
    link.target = '_blank';
    link.relList.add('noopener', 'noreferrer');
    const descriptions = new Set((link.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    descriptions.add('pwa-external-note');
    link.setAttribute('aria-describedby', [...descriptions].join(' '));
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) prepareExternalLink(link);
  new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node instanceof HTMLAnchorElement) prepareExternalLink(node);
      for (const link of node.querySelectorAll<HTMLAnchorElement>('a[href]')) prepareExternalLink(link);
    }
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    if (installButton) installButton.textContent = s.install;
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    prompt = null;
    syncDisplay();
  });
  installButton?.addEventListener('click', async () => {
    if (prompt) {
      const current = prompt;
      prompt = null;
      installButton.disabled = true;
      try {
        await current.prompt();
        const choice = await current.userChoice;
        if (choice.outcome === 'accepted') installed = true;
      } catch { openHelp(); }
      finally { installButton.disabled = false; syncDisplay(); }
    } else openHelp();
  });
  function openHelp() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const iosText = help?.querySelector<HTMLElement>('[data-pwa-ios]');
    const browserText = help?.querySelector<HTMLElement>('[data-pwa-browser]');
    if (iosText) iosText.hidden = !ios;
    if (browserText) browserText.hidden = ios;
    help?.showModal();
  }

  function syncConnection() {
    const cached = document.documentElement.dataset.pwaCached === 'true';
    if (connectionNotice) connectionNotice.hidden = navigator.onLine && !cached;
    if (connectionText) connectionText.textContent = navigator.onLine ? s.cached : s.offline;
    if (reloadButton) reloadButton.hidden = !navigator.onLine || !cached;
  }
  syncConnection();
  window.addEventListener('online', () => { syncConnection(); if (isApp()) void check(false); });
  window.addEventListener('offline', syncConnection);
  reloadButton?.addEventListener('click', () => { if (!dirty || confirm(s.saveFirst)) location.reload(); });
  for (const name of ['input', 'change']) document.addEventListener(name, (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('form:not([role="search"])')) dirty = true;
  });

  if (!import.meta.env.PROD || !window.isSecureContext || !('serviceWorker' in navigator)) {
    if (isApp()) {
      if (result) result.textContent = s.unsupported;
      if (checkButton) checkButton.disabled = true;
    }
    return;
  }

  async function syncVersion() {
    const version = await workerVersion(navigator.serviceWorker.controller || registration?.active || null);
    activeVersion = version;
    if (versionLabel && (pageVersion || version)) versionLabel.textContent = `${s.version} ${pageVersion || version}`;
    showUpdate();
  }
  // Fresh HTML can arrive before its worker is ready; a hash difference alone is insufficient.
  function canUpdate() {
    return !!registration?.waiting || !!(pageVersion && activeVersion && pageVersion !== activeVersion && activeVersion === latestVersion);
  }
  function showUpdate() {
    if (updateNotice) updateNotice.hidden = !isApp() || !canUpdate() || dismissed;
  }
  function watchInstalling() {
    const worker = registration?.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') { showUpdate(); void syncVersion(); }
    });
  }
  async function waitForInstall() {
    const worker = registration?.installing;
    if (!worker || ['installed', 'redundant'].includes(worker.state)) return;
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(finish, 15000);
      function finish() { clearTimeout(timer); worker?.removeEventListener('statechange', changed); resolve(); }
      function changed() { if (worker && ['installed', 'redundant'].includes(worker.state)) finish(); }
      worker.addEventListener('statechange', changed);
    });
  }
  async function check(manual: boolean) {
    if (!isApp() || checking || !registration) return;
    if (!navigator.onLine) { if (manual && result) result.textContent = s.checkOffline; return; }
    checking = true;
    lastCheck = Date.now();
    if (checkButton) checkButton.disabled = true;
    if (manual && result) result.textContent = s.checking;
    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(`${base}/version.json?check=${Date.now()}`, { cache: 'no-store', signal: abort.signal });
      if (!response.ok) throw new Error('Version unavailable');
      const remote: { version?: string } = await response.json();
      if (typeof remote.version !== 'string') throw new Error('Invalid version');
      latestVersion = remote.version;
      await registration.update();
      await waitForInstall();
      if (manual) dismissed = false;
      showUpdate();
      const current = await workerVersion(navigator.serviceWorker.controller || registration.active);
      activeVersion = current;
      showUpdate();
      if (manual && result) result.textContent = canUpdate() ? s.updateReady : current === remote.version && pageVersion === remote.version ? s.latest : s.preparing;
    } catch { if (manual && result) result.textContent = s.checkFailed; }
    finally { clearTimeout(timeout); checking = false; if (checkButton) checkButton.disabled = false; }
  }
  checkButton?.addEventListener('click', () => { void check(true); });
  document.querySelector('[data-pwa-later]')?.addEventListener('click', () => { dismissed = true; showUpdate(); });
  applyButton?.addEventListener('click', () => {
    if (!isApp() || !canUpdate() || (dirty && !confirm(s.saveFirst))) return;
    if (!registration?.waiting) { location.reload(); return; }
    applying = true;
    applyButton.disabled = true;
    applyButton.textContent = s.updating;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.setTimeout(() => {
      if (!applying) return;
      applying = false;
      applyButton.disabled = false;
      applyButton.textContent = s.update;
      if (result) result.textContent = s.updateFailed;
    }, 10000);
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applying) { applying = false; location.reload(); }
    else { void syncVersion(); if (isApp()) void check(false); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isApp() && Date.now() - lastCheck > 15 * 60 * 1000) void check(false);
  });
  void navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/`, updateViaCache: 'none' })
    .then((value) => {
      registration = value;
      registration.addEventListener('updatefound', watchInstalling);
      watchInstalling();
      showUpdate();
      void syncVersion();
      if (isApp()) void check(false);
    })
    .catch(() => {
      if (isApp() && result) result.textContent = s.checkFailed;
      if (checkButton) checkButton.disabled = true;
    });
}
