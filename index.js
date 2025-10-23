const { Command } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

const program = new Command();

// --- 1. Визначення обов'язкових параметрів ---
program
  // Commander.js автоматично виведе помилку, якщо не задано обов'язковий параметр.
  .requiredOption('-i, --input <path>', 'Шлях до файлу для читання')
  .requiredOption('-h, --host <address>', 'Адреса сервера')
  .requiredOption('-p, --port <number>', 'Порт сервера', (value) => {
    // Функція-обробник для перетворення порту на число
    const port = parseInt(value, 10);
    if (isNaN(port)) {
        throw new Error('Порт має бути числом.');
    }
    return port;
  });

// --- 2. Логіка виконання програми ---
program.action((options) => {
  const { input, host, port } = options;

  // --- Перевірка: Наявність вхідного файлу ---
  const absolutePath = path.resolve(input);
  if (!fs.existsSync(absolutePath)) {
    // Вимога: Програма має виводити помилку “Cannot find input file”
    console.error("Cannot find input file");
    process.exit(1); 
  }

  // --- 3. Запуск веб-сервера (модуль http) ---
  const server = http.createServer((req, res) => {
    // Просто повертаємо відповідь, що сервер працює
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Сервер працює на ${host}:${port}\nОчікування файлу: ${absolutePath}`);
  });

  // Запуск прослуховування на вказаних хості та порту
  server.listen(port, host, () => {
    console.log(`✅ Сервер запущено на: http://${host}:${port}`);
    console.log(`💻 Очікування вхідного файлу: ${absolutePath}`);
  });

}).parse(process.argv);
