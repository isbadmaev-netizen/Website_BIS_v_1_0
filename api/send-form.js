export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const { name, contact_info, message } = req.body;

  if (!name || !contact_info || !message) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  // Вот здесь магия безопасности: сервер берет ключи из своего закрытого хранилища, 
  // а не из этого файла. На GitHub улетит только этот текст.
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
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
      return res.status(200).json({ success: true });
    } else {
      throw new Error('Ошибка отправки в Telegram');
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}