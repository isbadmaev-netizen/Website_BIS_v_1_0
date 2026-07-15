const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 3000;

const rawAllowed = process.env.ALLOWED_ORIGIN || 'https://isbadmaev.ru';
const ALLOWED_ORIGINS = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHeaders(origin, isAllowed) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

export const handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);
  const headers = buildHeaders(origin, isAllowedOrigin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: isAllowedOrigin ? 204 : 403, headers, body: '' };
  }

  if (!isAllowedOrigin) {
    console.warn('Blocked request from unauthorized origin:', origin);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Доступ запрещён' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Метод не разрешён' }) };
  }

  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Неверный формат данных' }) };
  }

  const { name, contact_info, message, consent, bot_field } = bodyData || {};

  if (bot_field) {
    console.warn('Spam bot blocked by honeypot.');
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ success: true }) 
    };
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedContact = typeof contact_info === 'string' ? contact_info.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedContact || !trimmedMessage || !consent) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Заполните все поля и дайте согласие' }) };
  }

  if (trimmedName.length > MAX_FIELD_LENGTH || trimmedContact.length > MAX_FIELD_LENGTH || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Превышена длина полей' }) };
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка конфигурации сервера' }) };
  }

  const text = `🔥 <b>Новая заявка!</b>\n\n👤 <b>Имя:</b> ${escapeHtml(trimmedName)}\n📞 <b>Контакт:</b> ${escapeHtml(trimmedContact)}\n\n📝 <b>Задача:</b>\n<i>${escapeHtml(trimmedMessage)}</i>`;

  try {
    const resp = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });

    if (!resp.ok) throw new Error(`Telegram API responded with status ${resp.status}`);

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Telegram send error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ошибка сервера' }) };
  }
};