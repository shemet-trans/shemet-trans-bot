"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const corsOptions = {
    origin: [
        /* HTPP */
        'http://shemettrans.com',
        'http://www.shemettrans.com',
        /* HTPPS */
        'https://shemettrans.com',
        'https://www.shemettrans.com',
    ],
};
// Настройки Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID; // ID группы или канала
const bot = new node_telegram_bot_api_1.default(TELEGRAM_TOKEN);
// Настройки Express и Multer
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Директория для загрузки файлов
const UPLOAD_DIR = path_1.default.join(__dirname, 'uploads');
if (!fs_1.default.existsSync(UPLOAD_DIR))
    fs_1.default.mkdirSync(UPLOAD_DIR);
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = Date.now() + '_' + file.originalname;
        cb(null, unique);
    }
});
const upload = (0, multer_1.default)({ storage });
// Роут для обработки формы
// Поле для файла: 'attachment'
app.post('/submit', upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, email, message, consent } = req.body;
        let caption = `📩 *Новая заявка*\n` +
            `*Телефон:* ${phone}\n` +
            `*Email:* ${email}\n` +
            `*Сообщение:* ${message || '\-'}\n` +
            `*Согласие:* ${consent === 'true' ? 'да' : 'нет'}`;
        if (req.file) {
            // Отправляем документ
            const filePath = path_1.default.join(UPLOAD_DIR, req.file.filename);
            yield bot.sendDocument(CHAT_ID, filePath, { caption, parse_mode: 'Markdown' });
            // Удаляем файл после отправки
            fs_1.default.unlinkSync(filePath);
        }
        else {
            // Только текст
            yield bot.sendMessage(CHAT_ID, caption, { parse_mode: 'Markdown' });
        }
        res.json({ success: true, message: 'Заявка отправлена' });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка при отправке заявки' });
    }
}));
// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
