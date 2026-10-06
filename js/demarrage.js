    // Service worker → rend l'appli installable sur le téléphone (« Installer l'application »)
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('swcr.js').catch(() => {});
    }
