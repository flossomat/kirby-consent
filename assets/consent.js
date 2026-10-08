(() => {
  const configNode = document.getElementById('consent-config');
  const root = document.getElementById('consent');

  if (!configNode || !root) {
    return;
  }

  let config;

  try {
    config = JSON.parse(configNode.textContent || '{}');
  } catch (error) {
    return;
  }

  const banner = root.querySelector('.consent-banner');
  const settings = root.querySelector('.consent-settings');
  const categoryIds = Object.keys(config.categories || {});
  const loaded = new Map();
  let applyToken = 0;

  const blank = () => {
    const consent = { necessary: true, version: config.version };

    categoryIds.forEach((id) => {
      consent[id] = null;
    });

    return consent;
  };

  const read = () => {
    try {
      const raw = localStorage.getItem(config.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== config.version || parsed.necessary !== true) {
        return null;
      }

      const consent = blank();
      categoryIds.forEach((id) => {
        if (parsed[id] === true || parsed[id] === false) {
          consent[id] = parsed[id];
        }
      });

      return consent;
    } catch (error) {
      return null;
    }
  };

  const persist = (consent) => {
    const stored = {
      necessary: true,
      version: config.version,
      timestamp: new Date().toISOString(),
    };

    categoryIds.forEach((id) => {
      stored[id] = consent[id] === true ? true : consent[id] === false ? false : null;
    });

    localStorage.setItem(config.storageKey, JSON.stringify(stored));
    return read();
  };

  const isComplete = (consent) => categoryIds.every((id) => typeof consent[id] === 'boolean');

  const placeholderFor = (el) => {
    const id = el.dataset.consentGate;
    const meta = config.categories[id] || {};
    const box = document.createElement('div');
    box.className = 'consent-placeholder';

    const title = document.createElement('p');
    title.className = 'consent-placeholder-title';
    title.textContent = el.dataset.consentTitle || meta.label || 'Externer Inhalt';

    const text = document.createElement('p');
    text.className = 'consent-placeholder-text';
    text.textContent = el.dataset.consentText || meta.placeholder || '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'consent-button is-primary';
    button.dataset.consentGrant = id;
    button.textContent = el.dataset.consentButton || meta.button || 'Einwilligen';

    box.append(title, text, button);
    return box;
  };

  const setBlockedChildren = (el, blocked) => {
    [...el.children].forEach((child) => {
      if (child.classList.contains('consent-placeholder') || child.tagName === 'TEMPLATE') {
        return;
      }

      child.inert = blocked;
    });
  };

  const block = (el) => {
    el.classList.add('is-consent-blocked');
    el.querySelector(':scope > .consent-embed')?.remove();
    setBlockedChildren(el, true);

    if (!el.querySelector(':scope > .consent-placeholder')) {
      el.append(placeholderFor(el));
    }
  };

  const reveal = (el) => {
    el.classList.remove('is-consent-blocked');
    setBlockedChildren(el, false);
    el.querySelector(':scope > .consent-placeholder')?.remove();

    const template = el.querySelector(':scope > template');
    if (!template || el.querySelector(':scope > .consent-embed')) {
      return;
    }

    const embed = document.createElement('div');
    embed.className = 'consent-embed';
    embed.append(template.content.cloneNode(true));
    el.append(embed);
  };

  const loadAsset = (asset) => new Promise((resolve) => {
    if (asset.type === 'style' && asset.href) {
      if (document.querySelector(`link[data-consent-asset="${asset.href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = asset.href;
      link.dataset.consentAsset = asset.href;
      link.onload = () => resolve();
      link.onerror = () => resolve();
      document.head.append(link);
      return;
    }

    if (asset.type === 'script' && asset.src) {
      if (document.querySelector(`script[data-consent-asset="${asset.src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = asset.src;
      script.dataset.consentAsset = asset.src;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.body.append(script);
      return;
    }

    resolve();
  });

  const loadCategory = (id) => {
    if (!loaded.has(id)) {
      const assets = config.categories[id]?.assets || [];
      loaded.set(id, assets.reduce((chain, asset) => chain.then(() => loadAsset(asset)), Promise.resolve()));
    }

    return loaded.get(id);
  };

  const syncControls = (consent) => {
    root.querySelectorAll('[data-consent-category]').forEach((input) => {
      input.checked = consent[input.dataset.consentCategory] === true;
    });
  };

  const paint = (consent) => {
    const complete = isComplete(consent);
    const settingsOpen = !settings.hidden;

    document.body.classList.toggle('consent-banner-open', !complete && !settingsOpen);
    document.body.classList.toggle('consent-dialog-open', settingsOpen);

    if (settingsOpen) {
      root.hidden = false;
      banner.hidden = true;
      return;
    }

    root.hidden = complete;
    banner.hidden = complete;
  };

  const publish = (consent) => {
    const detail = { ...consent };
    document.dispatchEvent(new CustomEvent('consentchange', { detail }));
    document.dispatchEvent(new CustomEvent('consentready', { detail }));
  };

  const apply = async (consent) => {
    const token = ++applyToken;
    const needed = new Set();

    document.querySelectorAll('[data-consent-gate]').forEach((el) => {
      const id = el.dataset.consentGate;

      if (consent[id] === true) {
        needed.add(id);
      } else {
        block(el);
      }
    });

    await Promise.all([...needed].map((id) => loadCategory(id)));

    if (token !== applyToken) {
      return;
    }

    document.querySelectorAll('[data-consent-gate]').forEach((el) => {
      if (consent[el.dataset.consentGate] === true) {
        reveal(el);
      }
    });

    syncControls(consent);
    paint(consent);
    publish(consent);
  };

  const save = (consent, closeSettings = false) => {
    const stored = persist(consent);

    if (closeSettings) {
      settings.hidden = true;
      document.body.classList.remove('consent-dialog-open');
    }

    apply(stored);
  };

  const acceptAll = () => {
    const consent = blank();
    categoryIds.forEach((id) => {
      consent[id] = true;
    });
    save(consent, true);
  };

  const denyOptional = () => {
    const consent = blank();
    categoryIds.forEach((id) => {
      consent[id] = false;
    });
    save(consent, true);
  };

  const grant = (id) => {
    if (!config.categories[id]) {
      return;
    }

    const consent = read() || blank();
    consent[id] = true;
    save(consent, false);
  };

  const openSettings = () => {
    syncControls(read() || blank());
    settings.hidden = false;
    paint(read() || blank());
    settings.querySelector('.consent-settings-panel')?.focus();
  };

  const closeSettings = () => {
    settings.hidden = true;
    paint(read() || blank());

    if (!banner.hidden) {
      banner.querySelector('button')?.focus();
    }
  };

  const onClick = (event) => {
    const grantButton = event.target.closest('[data-consent-grant]');
    if (grantButton) {
      event.preventDefault();
      grant(grantButton.dataset.consentGrant);
      return;
    }

    const settingsButton = event.target.closest('[data-consent-open-settings]');
    if (settingsButton) {
      event.preventDefault();
      openSettings();
      return;
    }

    const actionButton = event.target.closest('[data-consent-action]');
    if (!actionButton || !root.contains(actionButton)) {
      return;
    }

    const action = actionButton.dataset.consentAction;

    if (action === 'all') {
      acceptAll();
    } else if (action === 'necessary') {
      denyOptional();
    } else if (action === 'settings') {
      openSettings();
    } else if (action === 'close-settings') {
      closeSettings();
    } else if (action === 'save') {
      const consent = read() || blank();
      root.querySelectorAll('[data-consent-category]').forEach((input) => {
        consent[input.dataset.consentCategory] = input.checked;
      });
      save(consent, true);
    }
  };

  document.addEventListener('click', onClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !settings.hidden) {
      closeSettings();
    }
  });

  settings.querySelector('.consent-settings-panel')?.setAttribute('tabindex', '-1');

  window.dasformtConsent = {
    get: () => read() || blank(),
    has: (id) => id === 'necessary' || read()?.[id] === true,
    grant,
    acceptAll,
    denyOptional,
    openSettings,
  };

  const stored = read();

  if (stored) {
    apply(stored);
  } else {
    document.querySelectorAll('[data-consent-gate]').forEach(block);
    paint(blank());
    publish(blank());
  }
})();
