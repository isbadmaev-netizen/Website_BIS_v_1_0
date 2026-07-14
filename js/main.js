/**
 * main.js
 * Базовая логика: мобильное меню, плавный скролл, валидация и отправка формы
 * Версия: финальная (согласие 152-ФЗ, серверные ошибки, a11y-фокус)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. МОБИЛЬНОЕ МЕНЮ
  // ==========================================
  const burgerBtn = document.querySelector('.nav__burger');
  const closeBtn = document.querySelector('.nav__close');
  const menu = document.getElementById('nav-menu');
  const overlay = document.getElementById('nav-overlay');
  const links = document.querySelectorAll('.nav__link');

  const closeMenu = () => {
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
    if (menu) menu.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'true');
    if (menu) menu.classList.add('is-open');
    if (overlay) overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  };

  if (burgerBtn && menu) {
  burgerBtn.addEventListener('click', () => {
    menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
  links.forEach(link => link.addEventListener('click', closeMenu));

  // ==========================================
  // 2. ПЛАВНЫЙ СКРОЛЛ К ЯКОРНЫМ ССЫЛКАМ
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId !== '#' && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80; // Отступ для плавающей шапки
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    });
  });

  // ==========================================
  // 3. ВАЛИДАЦИЯ И ОТПРАВКА ФОРМЫ
  // ==========================================
  const form = document.getElementById('contact-form');
  const statusBlock = document.getElementById('contact-status');
  const submitBtn = form ? form.querySelector('.contact__submit') : null;
  const submitBtnText = submitBtn ? submitBtn.querySelector('.contact__submit-text') : null;

  // Единый путь запроса. Реальный маршрут /.netlify/functions/send-form
  // проксируется через redirect в netlify.toml — так URL не завязан на конкретный хостинг
  const SUBMIT_ENDPOINT = '/api/send-form';

  if (form) {
    // Вспомогательная функция вывода ошибки под конкретным полем + возврат фокуса
    const showError = (inputElement, errorElementId, message) => {
      if (inputElement) inputElement.classList.add('is-invalid');
      const errorElement = document.getElementById(errorElementId);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('is-visible');
      }
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Сброс состояния перед новой попыткой
      form.querySelectorAll('.contact__input, .contact__textarea').forEach(el => el.classList.remove('is-invalid'));
      form.querySelectorAll('.contact__error').forEach(el => {
        el.textContent = '';
        el.classList.remove('is-visible');
      });
      if (statusBlock) {
        statusBlock.className = 'contact__status';
        statusBlock.textContent = '';
      }

      const nameInput = document.getElementById('name');
      const contactInput = document.getElementById('contact-info');
      const messageInput = document.getElementById('message');
      const consentInput = document.getElementById('consent');

      let isValid = true;
      let firstInvalidField = null;

      // Валидация обязательных полей
      if (!nameInput.value.trim()) {
        showError(nameInput, 'name-error', 'Пожалуйста, введите ваше имя');
        firstInvalidField = firstInvalidField || nameInput;
        isValid = false;
      }
      if (!contactInput.value.trim()) {
        showError(contactInput, 'contact-info-error', 'Укажите контакт для связи');
        firstInvalidField = firstInvalidField || contactInput;
        isValid = false;
      }
      if (!messageInput.value.trim()) {
        showError(messageInput, 'message-error', 'Опишите, пожалуйста, вашу задачу');
        firstInvalidField = firstInvalidField || messageInput;
        isValid = false;
      }
      if (consentInput && !consentInput.checked) {
        isValid = false;
        if (statusBlock) {
          statusBlock.textContent = 'Необходимо согласие на обработку персональных данных.';
          statusBlock.classList.add('is-error', 'is-visible');
        }
        firstInvalidField = firstInvalidField || consentInput;
      }

      // Прерываем отправку и возвращаем фокус на первое проблемное поле (важно для a11y)
      if (!isValid) {
        if (firstInvalidField) firstInvalidField.focus();
        return;
      }

      const formData = {
        name: nameInput.value.trim(),
        contact_info: contactInput.value.trim(),
        message: messageInput.value.trim(),
        consent: consentInput ? consentInput.checked : false
      };

      // Состояние кнопки "Отправка..."
      const originalBtnText = submitBtnText ? submitBtnText.textContent : (submitBtn ? submitBtn.textContent : 'Отправить');
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnText) submitBtnText.textContent = 'Отправка...';
        else submitBtn.textContent = 'Отправка...';
      }

      try {
        const response = await fetch(SUBMIT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        // Защита от сбоя парсинга, если сервер вернул пустой или невалидный body
        let result = {};
        try {
          result = await response.json();
        } catch (parseError) {
          result = {};
        }

        if (response.ok) {
          form.reset();
          if (statusBlock) {
            statusBlock.textContent = 'Спасибо! Заявка успешно отправлена. Я свяжусь с вами в ближайшее время.';
            statusBlock.classList.add('is-success', 'is-visible');
          }
        } else {
          throw new Error(result.error || 'Ошибка сервера');
        }
      } catch (error) {
        if (statusBlock) {
          statusBlock.textContent = error.message || 'Произошла ошибка при отправке. Попробуйте позже или напишите напрямую в Telegram.';
          statusBlock.classList.add('is-error', 'is-visible');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtnText) submitBtnText.textContent = originalBtnText;
          else submitBtn.textContent = originalBtnText;
        }
      }
    });
  }
});