// netlify/functions/send-form.js
// Поддержка нескольких разрешённых доменов через ALLOWED_ORIGIN (список через запятую)

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 3000;

// Список разрешённых доменов читается из переменной окружения через запятую.
const rawAllowed = process.env.ALLOWED_ORIGIN || 'https://isbadmaev.ru';
const ALLOWED_ORIGINS = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);

function buildHeaders(origin, isAllowed) {
  const base = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (isAllowed) {
    base['Access-Control-Allow-Origin'] = origin;
  }
  return base;
}

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  const headers = buildHeaders(origin, isAllowedOrigin);

  // 1. Предварительный запрос (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    if (!isAllowedOrigin) return { statusCode: 403, body: '' };
    return { statusCode: 204, headers, body: '' };
  }

  // 2. Блокировка доступа с чужих доменов
  if (!isAllowedOrigin) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ 
        error: 'Доступ запрещён',
        received: origin,            // ПОКАЖЕТ, ЧТО ПРИШЛО
        allowed: ALLOWED_ORIGINS     // ПОКАЖЕТ, ЧТО ОЖИДАЛОСЬ
      }),
    };
  }

  // 3. Метод должен быть POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Метод не разрешён' }),
    };
  }

  // 4. Парсинг и валидация
  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Неверный формат данных' }) };
  }

  const { name, contact_info, message, consent } = bodyData || {};

  if (!name || !contact_info || !message) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Заполните все поля' }) };
  }

  if (!consent) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Необходимо согласие' }) };
  }

  if (name.length > MAX_FIELD_LENGTH || contact_info.length > MAX_FIELD_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Превышена длина полей' }) };
  }

  // 5. Отправка в Telegram
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка конфигурации сервера' }) };
  }

  const text = `🔥 <b>Новая заявка!</b>\n\n👤 <b>Имя:</b> ${escapeHtml(name)}\n📞 <b>Контакт:</b> ${escapeHtml(contact_info)}\n\n📝 <b>Задача:</b>\n<i>${escapeHtml(message)}</i>`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!response.ok) throw new Error('Ошибка Telegram API');
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Внутренняя ошибка сервера' }) };
  }
};