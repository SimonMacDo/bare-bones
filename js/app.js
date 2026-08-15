/* Bare Bones prototype interactions: navigation, local voting and sold-price game. */

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    navigation.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }
});

// Community voting uses seeded sample totals plus one vote saved in localStorage.
const voteContainer = document.querySelector('[data-vote-container]');
const voteCards = [...document.querySelectorAll('.vote-card')];
const voteStorageKey = 'bareBonesPrototypeVote';
const baseVotes = {
  'Penge Victorian': 47,
  'Anerley Edwardian': 35,
  'Sydenham Probate': 28
};

function readSavedVote() {
  try {
    return window.localStorage.getItem(voteStorageKey);
  } catch {
    return null;
  }
}

function saveVote(property) {
  try {
    window.localStorage.setItem(voteStorageKey, property);
  } catch {
    // Voting still works for this page view when storage is unavailable.
  }
}

function renderVotes(selectedProperty = readSavedVote()) {
  const totals = { ...baseVotes };
  if (selectedProperty && totals[selectedProperty] !== undefined) totals[selectedProperty] += 1;

  const totalVotes = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const leader = Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];

  voteCards.forEach((card) => {
    const property = card.dataset.property;
    const percentage = Math.round((totals[property] / totalVotes) * 100);
    const button = card.querySelector('.vote-button');
    card.querySelector('.vote-meter i').style.width = `${percentage}%`;
    card.querySelector('.vote-share').textContent = `${percentage}% of ${totalVotes} visitors`;
    button.disabled = Boolean(selectedProperty);
    button.classList.toggle('selected', selectedProperty === property);
    if (selectedProperty === property) button.textContent = 'Your choice';
  });

  document.querySelector('#visitor-choice').textContent = selectedProperty ? leader : 'Vote to reveal';
}

voteContainer?.addEventListener('click', (event) => {
  const button = event.target.closest('.vote-button');
  if (!button || readSavedVote()) return;
  const property = button.closest('.vote-card').dataset.property;
  saveVote(property);
  renderVotes(property);
});

renderVotes();

// The sold-price teaser compares a selected price against one fictional result.
const actualSoldPrice = 755000;
const guessGame = document.querySelector('[data-guess-game]');
const guessResult = document.querySelector('#guess-result');

guessGame?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-price]');
  if (!button || guessGame.dataset.complete) return;

  const guessedPrice = Number(button.dataset.price);
  const error = Math.abs(guessedPrice - actualSoldPrice) / actualSoldPrice * 100;
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', maximumFractionDigits: 0
  }).format(actualSoldPrice);

  guessGame.dataset.complete = 'true';
  [...guessGame.querySelectorAll('button')].forEach((option) => {
    option.disabled = true;
    option.classList.toggle('chosen', option === button);
  });

  guessResult.innerHTML = `
    <strong>It sold for ${formattedPrice}.</strong>
    <p>Your estimate was ${error.toFixed(1)}% ${guessedPrice === actualSoldPrice ? 'from the sale price' : guessedPrice < actualSoldPrice ? 'below the sale price' : 'above the sale price'}. Competition reflected the garden and transport, while the condition kept it below finished local examples.</p>
  `;
});

// Prototype-only newsletter feedback; no address is transmitted or stored.
document.querySelector('[data-newsletter-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelector('.form-message').textContent = 'Thank you — subscriptions will open in a later prototype.';
  form.reset();
});

// Google Analytics loads only after an explicit consent choice.
const analyticsMeasurementId = 'G-HYCXB74X9S';
const analyticsConsentStorageKey = 'bareBonesAnalyticsConsent';
const consentBanner = document.querySelector('[data-consent-banner]');
const acceptAnalyticsButton = document.querySelector('[data-analytics-accept]');
const rejectAnalyticsButton = document.querySelector('[data-analytics-reject]');
const cookieSettingsButton = document.querySelector('[data-cookie-settings]');
let googleAnalyticsLoaded = false;

function readAnalyticsConsent() {
  try {
    const consent = window.localStorage.getItem(analyticsConsentStorageKey);
    return consent === 'granted' || consent === 'denied' ? consent : null;
  } catch {
    return null;
  }
}

function saveAnalyticsConsent(consent) {
  try {
    window.localStorage.setItem(analyticsConsentStorageKey, consent);
  } catch {
    // Visitors can still make a choice for the current page.
  }
}

function updateAnalyticsConsent(analyticsStorage) {
  window.gtag?.('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: analyticsStorage
  });
}

function loadGoogleAnalytics() {
  if (googleAnalyticsLoaded) return;

  googleAnalyticsLoaded = true;
  updateAnalyticsConsent('granted');

  const googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsMeasurementId)}`;
  googleTag.dataset.googleAnalytics = analyticsMeasurementId;
  document.head.appendChild(googleTag);

  window.gtag('js', new Date());
  window.gtag('config', analyticsMeasurementId);
}

function hideConsentBanner() {
  if (!consentBanner) return;
  consentBanner.hidden = true;
  cookieSettingsButton?.setAttribute('aria-expanded', 'false');
}

function showConsentBanner(moveFocus = false) {
  if (!consentBanner) return;
  consentBanner.hidden = false;
  cookieSettingsButton?.setAttribute('aria-expanded', 'true');
  if (moveFocus) acceptAnalyticsButton?.focus();
}

function applyAnalyticsConsent(consent) {
  const analyticsWasLoaded = googleAnalyticsLoaded;
  saveAnalyticsConsent(consent);

  if (consent === 'granted') {
    loadGoogleAnalytics();
    hideConsentBanner();
    return;
  }

  updateAnalyticsConsent('denied');
  hideConsentBanner();

  // Reload after withdrawal so no already-loaded Google tag remains active.
  if (analyticsWasLoaded) window.location.reload();
}

acceptAnalyticsButton?.addEventListener('click', () => applyAnalyticsConsent('granted'));
rejectAnalyticsButton?.addEventListener('click', () => applyAnalyticsConsent('denied'));
cookieSettingsButton?.addEventListener('click', () => showConsentBanner(true));

const savedAnalyticsConsent = readAnalyticsConsent();
if (savedAnalyticsConsent === 'granted') {
  loadGoogleAnalytics();
} else if (savedAnalyticsConsent !== 'denied') {
  showConsentBanner();
}
