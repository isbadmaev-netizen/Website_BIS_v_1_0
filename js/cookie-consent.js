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
    // Если нет — ждем 1 секунду и плавно показываем баннер
    setTimeout(() => {
      cookieBanner.removeAttribute('hidden');
    }, 1000);
  }

  // Что происходит при клике на кнопку "Принять"
  acceptButton.addEventListener('click', () => {
    // Записываем согласие в память браузера
    localStorage.setItem('cookie_consent_accepted', 'true');
    
    // Плавно прячем баннер
    cookieBanner.setAttribute('hidden', '');
  });
});