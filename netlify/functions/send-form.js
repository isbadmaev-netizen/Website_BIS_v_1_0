export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Метод не разрешен' }),
    };
  }

  let bodyData;
  try {
    bodyData = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Неверный формат данных' }),
    };
  }

  const { name, contact_info, message } = bodyData;

  if (!name || !contact_info || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Заполните все поля' }),
    };
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка конфигурации сервера' }),
    };
  }

  const text = `
🔥 <b>Новая заявка с сайта!</b>

👤 <b>Имя:</b> ${name}
📞 <b>Контакт:</b> ${contact_info}

📝 <b>Суть задачи:</b>
<i>${message}</i>
  `;

  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } else {
      throw new Error('Ошибка отправки в Telegram');
    }
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
    };
  }
};