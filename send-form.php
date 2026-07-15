<?php
// Лимиты из твоего старого файла
define('MAX_FIELD_LENGTH', 500);
define('MAX_MESSAGE_LENGTH', 3000);

// Разрешенные домены (строгая защита CORS)
$rawAllowed = 'https://isbadmaev.ru';
$allowedOrigins = array_filter(array_map('trim', explode(',', $rawAllowed)));

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isAllowedOrigin = in_array($origin, $allowedOrigins);

// Устанавливаем базовые заголовки
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($isAllowedOrigin) {
    header("Access-Control-Allow-Origin: $origin");
}

// Обработка предварительного запроса браузера (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code($isAllowedOrigin ? 204 : 403);
    exit;
}

// Блокировка запросов с чужих доменов
if (!$isAllowedOrigin) {
    http_response_code(403);
    echo json_encode(['error' => 'Доступ запрещён']);
    exit;
}

// Блокировка неправильных методов (если кто-то стучится не через POST)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешён']);
    exit;
}

// Чтение и парсинг входящих JSON-данных
$input = file_get_contents('php://input');
$bodyData = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Неверный формат данных']);
    exit;
}

// Ловушка для спам-ботов (Honeypot)
if (!empty($bodyData['bot_field'])) {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Получение и очистка полей
$name = isset($bodyData['name']) ? trim((string)$bodyData['name']) : '';
$contact_info = isset($bodyData['contact_info']) ? trim((string)$bodyData['contact_info']) : '';
$message = isset($bodyData['message']) ? trim((string)$bodyData['message']) : '';
$consent = !empty($bodyData['consent']);

// Проверка на пустоту
if ($name === '' || $contact_info === '' || $message === '' || !$consent) {
    http_response_code(400);
    echo json_encode(['error' => 'Заполните все поля и дайте согласие']);
    exit;
}

// Проверка длины строк
if (mb_strlen($name, 'UTF-8') > MAX_FIELD_LENGTH || 
    mb_strlen($contact_info, 'UTF-8') > MAX_FIELD_LENGTH || 
    mb_strlen($message, 'UTF-8') > MAX_MESSAGE_LENGTH) {
    http_response_code(400);
    echo json_encode(['error' => 'Превышена длина полей']);
    exit;
}

// Подключаем скрытый конфигурационный файл с ключами (создается автоматически при деплое)
require_once 'config.php';

// Функция безопасного экранирования спецсимволов
function escapeHtml($unsafe) {
    return htmlspecialchars($unsafe, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

// Сборка сообщения
$text = "🔥 <b>Новая заявка!</b>\n\n";
$text .= "👤 <b>Имя:</b> " . escapeHtml($name) . "\n";
$text .= "📞 <b>Контакт:</b> " . escapeHtml($contact_info) . "\n\n";
$text .= "📝 <b>Задача:</b>\n<i>" . escapeHtml($message) . "</i>";

// Настройки отправки в Telegram
$url = "https://api.telegram.org/bot{$botToken}/sendMessage";
$post_fields = json_encode([
    'chat_id' => $chatId,
    'text' => $text,
    'parse_mode' => 'HTML'
]);

// Инициализация curl (отправка запроса)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Проверка ответа сервера
if ($httpcode == 200) {
    http_response_code(200);
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Ошибка сервера']);
}