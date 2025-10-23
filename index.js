// index.js

const { Command } = require('commander');
const http = require('http');
// Використовуємо promises-версію для асинхронних викликів readFile
const fs = require('fs/promises'); 
const path = require('path');
const url = require('url');
const { XMLBuilder } = require('fast-xml-parser');

const program = new Command();

// --- 1. Визначення обов'язкових параметрів (Частина 1) ---
program
  .requiredOption('-i, --input <path>', 'Шлях до файлу для читання')
  .requiredOption('-h, --host <address>', 'Адреса сервера')
  .requiredOption('-p, --port <number>', 'Порт сервера', (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port)) throw new Error('Порт має бути числом.');
    return port;
  });


// --- Функція обробки даних та формування XML ---
function processDataAndBuildXML(jsonData, query) {
    let records;
    try {
        // Програма має виконувати завдання незалежно від того, які значення мають поля
        records = JSON.parse(jsonData);
    } catch (e) {
        throw new Error("Invalid JSON file content.");
    }

    // --- Фільтрація: ?min_rainfall=X ---
    const minRainfall = parseFloat(query.min_rainfall);
    if (!isNaN(minRainfall)) {
        records = records.filter(record => record.Rainfall > minRainfall);
    }

    // --- Формування JSON-структури для XML ---
    const xmlData = { weather_data: { record: [] } };

    records.forEach(record => {
        const recordData = {
            // Вихідні поля: Rainfall, Pressure3pm
            rainfall: record.Rainfall, 
            pressure3pm: record.Pressure3pm
        };
        
        // --- Фільтрація: ?humidity=true ---
        if (query.humidity === 'true') {
            // Відображати вологість вдень (поле Humidity3pm)
            recordData.humidity = record.Humidity3pm;
        }

        xmlData.weather_data.record.push(recordData);
    });

    // --- Формування XML за допомогою fast-xml-parser ---
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        format: true // Для гарного форматування
    });

    return builder.build(xmlData);
}


// --- 2. Логіка виконання програми та запуск сервера ---
program.action(async (options) => {
    const { input, host, port } = options;
    const absolutePath = path.resolve(input);

    // --- Перевірка: Наявність вхідного файлу (Асинхронна перевірка) ---
    try {
        await fs.access(absolutePath, fs.constants.R_OK); 
    } catch (e) {
        console.error("Cannot find input file");
        process.exit(1); 
    }
    
    // --- 3. Запуск веб-сервера ---
    const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url, true); // true для парсингу query-параметрів
        
        if (req.method !== 'GET' || parsedUrl.pathname !== '/') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not Found');
        }

        try {
            // --- Асинхронне Читання JSON з файлу ---
            const fileContent = await fs.readFile(absolutePath, 'utf8');
            
            // --- Обробка та формування XML ---
            const xmlResponse = processDataAndBuildXML(fileContent, parsedUrl.query);
            
            // --- Надсилання XML у відповідь ---
            res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
            res.end(xmlResponse);

        } catch (error) {
            console.error('Помилка обробки запиту:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error: ' + error.message);
        }
    });

    server.listen(port, host, () => {
        console.log(`✅ Сервер запущено на: http://${host}:${port}`);
        console.log(`💻 Вхідний файл: ${absolutePath}`);
    });

}).parse(process.argv);