import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import NodeTelegramBotApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cors from 'cors'

dotenv.config();

const corsOptions = {
  origin: [
    /* HTPP */
    'http://shemettrans.com',
    'http://www.shemettrans.com',

    /* HTPPS */
    'https://shemettrans.com',
    'https://www.shemettrans.com',
  ],
}

// Настройки Telegram
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!; // ID группы или канала
const bot = new NodeTelegramBotApi(TELEGRAM_TOKEN);

// Настройки Express и Multer
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Директория для загрузки файлов
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + file.originalname;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Роут для обработки формы
// Поле для файла: 'attachment'
app.post('/submit', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { phone, email, message, consent } = req.body;
    let caption = `📩 *Новая заявка*\n` +
                  `*Телефон:* ${phone}\n` +
                  `*Email:* ${email}\n` +
                  `*Сообщение:* ${message || '\-'}\n` +
                  `*Согласие:* ${consent === 'true' ? 'да' : 'нет'}`;

    if (req.file) {
      // Отправляем документ
      const filePath = path.join(UPLOAD_DIR, req.file.filename);
      await bot.sendDocument(CHAT_ID, filePath, { caption, parse_mode: 'Markdown' });
      // Удаляем файл после отправки
      fs.unlinkSync(filePath);
    } else {
      // Только текст
      await bot.sendMessage(CHAT_ID, caption, { parse_mode: 'Markdown' });
    }

    res.json({ success: true, message: 'Заявка отправлена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Ошибка при отправке заявки' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
