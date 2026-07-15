# isbadmaev.ru

Личный сайт-визитка. 
Стек: HTML5, CSS3, Vanilla JS, Netlify Serverless Functions.

## Развертывание (Deploy)

Проект настроен для автоматического деплоя через **Netlify**.

### Переменные окружения (Environment Variables)
Для корректной работы формы обратной связи, в панели управления Netlify (Site settings > Environment variables) должны быть заданы следующие ключи:

* `ALLOWED_ORIGIN` — `https://isbadmaev.ru`
* `TELEGRAM_BOT_TOKEN` — токен бота, полученный в BotFather.
* `TELEGRAM_CHAT_ID` — ID чата, куда бот будет отправлять заявки.