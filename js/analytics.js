(() => {
  'use strict';

  const measurementId = 'G-HYCXB74X9S';
  const consentStorageKey = 'bareBonesAnalyticsConsent';
  const consentBanner = document.querySelector('[data-consent-banner]');
  const acceptButton = document.querySelector('[data-analytics-accept]');
  const rejectButton = document.querySelector('[data-analytics-reject]');
  const settingsButton = document.querySelector('[data-cookie-settings]');
  let analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  function readConsent() {
    try {
      const consent = window.localStorage.getItem(consentStorageKey);
      return consent === 'granted' || consent === 'denied' ? consent : null;
    } catch {
      return null;
    }
  }

  let currentConsent = readConsent();

  function saveConsent(consent) {
    currentConsent = consent;
    try {
      window.localStorage.setItem(consentStorageKey, consent);
    } catch {
      // The choice still applies to the current page if storage is unavailable.
    }
  }

  function updateConsent(analyticsStorage) {
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: analyticsStorage
    });
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;

    analyticsLoaded = true;
    updateConsent('granted');

    const googleTag = document.createElement('script');
    googleTag.async = true;
    googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    googleTag.dataset.googleAnalytics = measurementId;
    document.head.appendChild(googleTag);

    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });
  }

  function hideConsentBanner() {
    consentBanner.hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
  }

  function showConsentBanner(moveFocus = false) {
    consentBanner.hidden = false;
    settingsButton.setAttribute('aria-expanded', 'true');
    if (moveFocus) acceptButton.focus();
  }

  function applyConsent(consent) {
    const analyticsWasLoaded = analyticsLoaded;
    saveConsent(consent);

    if (consent === 'granted') {
      loadAnalytics();
      hideConsentBanner();
      return;
    }

    updateConsent('denied');
    hideConsentBanner();

    if (analyticsWasLoaded) window.location.reload();
  }

  window.bareBonesAnalytics = Object.freeze({
    track(eventName, parameters = {}) {
      if (!analyticsLoaded || currentConsent !== 'granted') return;
      window.gtag('event', eventName, parameters);
    }
  });

  acceptButton.addEventListener('click', () => applyConsent('granted'));
  rejectButton.addEventListener('click', () => applyConsent('denied'));
  settingsButton.addEventListener('click', () => showConsentBanner(true));

  if (currentConsent === 'granted') {
    loadAnalytics();
  } else if (currentConsent !== 'denied') {
    showConsentBanner();
  }
})();
