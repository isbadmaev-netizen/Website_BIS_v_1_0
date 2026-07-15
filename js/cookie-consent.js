/**
 * cookie-consent.js
 * Логика показа и скрытия баннера Cookie по 152-ФЗ
 */

document.addEventListener('DOMContentLoaded', () => {
  const cookieBanner = document.getElementById('cookie-consent');
  const acceptButton = document.getElementById('cookie-consent-accept');

  if (!cookieBanner || !acceptButton) return;

  // Проверяем память браузера: соглашался ли уже пользователь?
  const hasConsented = localStorage.getItem('cookie_consent_accepted');

  if (!hasConsented) {
    // Инкапсулируем логику показа
    const showBanner = () => {
      cookieBanner.removeAttribute('hidden');
      requestAnimationFrame(() => {
        cookieBanner.classList.add('is-visible');
      });
    };

    // Кроссбраузерная защита: используем requestIdleCallback, а для Safari/iOS откатываемся к setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(showBanner, { timeout: 2000 });
    } else {
      setTimeout(showBanner, 1000);
    }
  }

  // Что происходит при клике на кнопку "Принять"
  acceptButton.addEventListener('click', () => {
    localStorage.setItem('cookie_consent_accepted', 'true');
    cookieBanner.classList.remove('is-visible');
    cookieBanner.setAttribute('hidden', '');
  });
});