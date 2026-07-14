/**
 * main.js
 * Базовая логика: мобильное меню, плавный скролл, валидация и отправка формы
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. МОБИЛЬНОЕ МЕНЮ С ОВЕРЛЕЕМ И КРЕСТИКОМ
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
    // Возвращаем возможность прокручивать сайт
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'true');
    if (menu) menu.classList.add('is-open');
    if (overlay) overlay.classList.add('is-active');
    // Блокируем фон сайта от прокрутки
    document.body.style.overflow = 'hidden';
  };

  if (burgerBtn) {
    burgerBtn.addEventListener('click', () => {
      const isMenuOpen = menu.classList.contains('is-open');
      isMenuOpen ? closeMenu() : openMenu();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

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
  
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
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

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Останавливаем стандартную перезагрузку страницы

      // Сбрасываем старые ошибки
      const inputs = form.querySelectorAll('.contact__input, .contact__textarea');
      const errors = form.querySelectorAll('.contact__error');
      
      inputs.forEach(input => input.classList.remove('is-invalid'));
      errors.forEach(error => {
        error.textContent = '';
        error.classList.remove('is-visible');
      });
      
      if (statusBlock) {
        statusBlock.className = 'contact__status'; // Сбрасываем все классы
        statusBlock.textContent = '';
      }

      // Собираем данные
      const nameInput = document.getElementById('name');
      const contactInfoInput = document.getElementById('contact-info');
      const messageInput = document.getElementById('message');
      const consentInput = document.getElementById('consent');

      let isValid = true;

      // Вспомогательная функция показа ошибок
      const showError = (inputElement, errorElementId, message) => {
        if (inputElement) inputElement.classList.add('is-invalid');
        const errorElement = document.getElementById(errorElementId);
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.classList.add('is-visible');
        }
        isValid = false;
      };

      // Проверка заполненности полей
      if (!nameInput.value.trim()) showError(nameInput, 'name-error', 'Пожалуйста, введите ваше имя');
      if (!contactInfoInput.value.trim()) showError(contactInfoInput, 'contact-info-error', 'Укажите контакт для связи');
      if (!messageInput.value.trim()) showError(messageInput, 'message-error', 'Опишите, пожалуйста, вашу задачу');
      
      if (consentInput && !consentInput.checked) {
         isValid = false;
         if (statusBlock) {
            statusBlock.textContent = 'Необходимо согласие на обработку персональных данных.';
            statusBlock.classList.add('is-error', 'is-visible');
         }
      }

      // Если есть ошибки — прерываем отправку
      if (!isValid) return; 

      // Готовим объект с данными для отправки
      const formData = {
        name: nameInput.value.trim(),
        contact_info: contactInfoInput.value.trim(),
        message: messageInput.value.trim()
      };

      // Меняем состояние кнопки на "Отправка..." (с защитой от отсутствия span)
      let originalBtnText = '';
      if (submitBtn) {
        submitBtn.disabled = true;
        originalBtnText = submitBtnText ? submitBtnText.textContent : submitBtn.textContent;
        
        if (submitBtnText) {
          submitBtnText.textContent = 'Отправка...';
        } else {
          submitBtn.textContent = 'Отправка...';
        }
      }

      try {
        // Отправляем запрос на бессерверную функцию Netlify
        const response = await fetch('/.netlify/functions/send-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          // Успех!
          form.reset(); 
          if (statusBlock) {
            statusBlock.textContent = 'Спасибо! Заявка успешно отправлена. Я свяжусь с вами в ближайшее время.';
            statusBlock.classList.add('is-success', 'is-visible');
          }
        } else {
          throw new Error('Ошибка сервера');
        }
      } catch (error) {
        // Ошибка (например, нет интернета или ошибка сервера)
        if (statusBlock) {
          statusBlock.textContent = 'Произошла ошибка при отправке. Пожалуйста, попробуйте позже или напишите напрямую в Telegram.';
          statusBlock.classList.add('is-error', 'is-visible');
        }
      } finally {
        // Возвращаем кнопку в исходное состояние
        if (submitBtn) {
          submitBtn.disabled = false;
          if (submitBtnText) {
            submitBtnText.textContent = originalBtnText;
          } else {
            submitBtn.textContent = originalBtnText;
          }
        }
      }
    });
  }
});