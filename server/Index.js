const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const session = require('express-session');
const app = express();
const port = 5000;
const API_BASE_URL = "http://localhost:5000";
const allowedOrigins = [
    'https://your-production-domain.com',
    'http://localhost:3000'
];

// Конфигурация сессий (добавьте после настройки CORS)
app.use(session({
    secret: 'your_session_secret', // Секретный ключ для подписи сессии
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Для разработки (true в production с HTTPS)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 день
        sameSite: 'lax' // Для защиты от CSRF
    }
}));

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Разрешаем передачу кук
}));

// После app.use(cors())
app.options('*', cors()); // Разрешить preflight запросы для всех роутов
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});



// Регистрация
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], (err) => {
        if (err) return res.status(400).json({ error: 'Пользователь уже существует' });
        res.json({ message: 'Пользователь зарегистрирован' });
    });
});

// Логин
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        console.log('Login attempt:', username); // Добавьте логирование
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = results[0];
        if (!bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Сохраняем пользователя в сессии
        req.session.user = {
            id: user.id,
            username: user.username
        };
        console.log('Session created:', req.sessionID);

        res.json({ message: 'Вы успешно вошли в систему' });
    });
});

// Роут для выхода
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка при выходе' });
        }
        res.clearCookie('connect.sid'); // Очищаем куку сессии
        res.json({ success: true });
    });
});


// Настройка соединения с MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Admin', // ваше имя пользователя
    password: 'P@ssw0rd', // ваш пароль
    database: 'competition_reports'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});


app.get('/api/events/export', authMiddleware, async (req, res) => {
    try {
        const format = req.query.format || 'excel';
        const events = await getFilteredEvents(req.query);

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Мероприятия');

            // Добавляем столбец для пути к фото
            worksheet.columns = [
                { header: 'Название', key: 'full_name', width: 30 },
                { header: 'Дата', key: 'event_date', width: 15 },
                { header: 'Место', key: 'location', width: 20 },
                { header: 'Уровень', key: 'event_level', width: 20 },
                { header: 'Результат', key: 'result_level', width: 20 },
                { header: 'Преподаватели', key: 'teachers', width: 40 },
                { header: 'Студенты', key: 'students', width: 40 },
                { header: 'Путь к фото', key: 'photo_path', width: 50 } // Новый столбец
            ];

            // Формируем полные URL для фото
            const eventsWithFullPaths = events.map(event => ({
                ...event,
                photo_path: event.photo_path
                    ? `${API_BASE_URL}${event.photo_path}`
                    : 'Нет фото'
            }));

            // Добавляем данные
            eventsWithFullPaths.forEach(event => {
                worksheet.addRow({
                    full_name: event.full_name,
                    event_date: event.event_date,
                    location: event.location,
                    event_level: event.event_level,
                    result_level: event.result_level,
                    teachers: event.teachers,
                    students: event.students,
                    photo_path: event.photo_path // Добавляем путь
                });
            });

            // Делаем пути кликабельными
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) { // Пропускаем заголовок
                    const photoCell = row.getCell('photo_path');
                    if (photoCell.value && photoCell.value !== 'Нет фото') {
                        photoCell.value = {
                            text: photoCell.value,
                            hyperlink: photoCell.value
                        };
                        photoCell.font = { color: { argb: 'FF0000FF' }, underline: true };
                    }
                }
            });

            // Отправляем файл
            const buffer = await workbook.xlsx.writeBuffer();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=events.xlsx');
            res.send(buffer);
        }
        else if (format === 'pdf')
        {
            const doc = new PDFDocument();
            const buffers = [];

            // Регистрируем кириллические шрифты
            const fontPath = path.join(__dirname, 'fonts', 'arial.ttf');
            const boldFontPath = path.join(__dirname, 'fonts', 'arial-bold.ttf');

            doc.registerFont('Arial', fontPath);
            doc.registerFont('Arial-Bold', boldFontPath);

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=events_${Date.now()}.pdf`);
                res.send(pdfData);
            });

            // Используем кириллические шрифты
            doc.font('Arial');
            doc.fontSize(16).text('Отчет о мероприятиях', { align: 'center' });
            doc.moveDown();

            events.forEach((event, index) => {
                doc.font('Arial-Bold').fontSize(12).text(`Мероприятие #${index + 1}: ${event.full_name}`);
                doc.font('Arial').fontSize(10);
                doc.text(`Дата: ${new Date(event.event_date).toLocaleDateString('ru-RU')}`);
                doc.text(`Место: ${event.location}`);
                doc.text(`Уровень: ${event.event_level}`);
                doc.text(`Результат: ${event.result_level}`);
                doc.text(`Преподаватели: ${event.teachers || 'нет'}`);
                doc.text(`Студенты: ${event.students || 'нет'}`);

                if (event.photo_path) {
                    try {
                        const cleanPath = event.photo_path.startsWith('/uploads/')
                            ? event.photo_path.substring('/uploads/'.length)
                            : event.photo_path;

                        const imagePath = path.join(__dirname, 'uploads', cleanPath);

                        if (fs.existsSync(imagePath)) {
                            const ext = path.extname(imagePath).toLowerCase();
                            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                                doc.moveDown().text('Фото:');
                                doc.image(imagePath, {
                                    fit: [200, 200],
                                    align: 'center'
                                });
                            } else {
                                doc.text('(Формат изображения не поддерживается)');
                            }
                        } else {
                            doc.text('(Файл изображения не найден)');
                        }
                    } catch (error) {
                        console.error('Error loading image:', error);
                        doc.text('(Ошибка загрузки фото)');
                    }
                }

                doc.moveDown().moveDown();
            });

            doc.end();
        }
    } catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Export failed' });
        }
    }
});

const upload = multer({ storage });

// API Endpoints

// Получение списка преподавателей
app.get('/api/teachers', (req, res) => {
    const sql = `
    SELECT t.id, t.full_name, d.name AS department 
    FROM teachers t
    JOIN departments d ON t.department_id = d.id
  `;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Получение списка студентов
app.get('/api/students', (req, res) => {
    const sql = `
    SELECT s.id, s.full_name, g.name AS group_name 
    FROM students s
    JOIN student_groups g ON s.group_id = g.id
  `;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Получение уровней мероприятий
app.get('/api/event-levels', (req, res) => {
    db.query('SELECT * FROM event_levels', (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Получение уровней результатов
app.get('/api/result-levels', (req, res) => {
    db.query('SELECT * FROM result_levels', (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Получение кафедр (исправлено)
app.get('/api/departments', (req, res) => {
    db.query('SELECT * FROM departments', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Получение групп студентов (исправлено)
app.get('/api/student-groups', (req, res) => {
    db.query('SELECT * FROM student_groups', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Создание нового мероприятия
app.post('/api/events', authMiddleware, upload.single('photo'), (req, res) => {
    const { full_name, event_date, location, event_level_id, result_level_id, teachers, students } = req.body;

    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    // Удалите преобразование в числа (оно уже не нужно)
    const teachersArray = teachers
        ? teachers.split(',').filter(Boolean)
        : [];

    const studentsArray = students
        ? students.split(',').filter(Boolean)
        : [];

    // Начинаем транзакцию
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: err.message });

        const eventSql = `
      INSERT INTO events 
        (full_name, event_date, location, event_level_id, result_level_id, photo_path) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        db.query(eventSql, [full_name, event_date, location, event_level_id, result_level_id, photo_path], (err, result) => {
            if (err) return rollback(res, err);

            const eventId = result.insertId;
            const queries = [];

            // Добавляем запросы для преподавателей
            if (teachersArray.length > 0) {
                const teacherValues = teachersArray.map(teacherId => [eventId, teacherId]);
                queries.push(
                    new Promise((resolve, reject) => {
                        db.query('INSERT INTO event_teachers (event_id, teacher_id) VALUES ?',
                            [teacherValues],
                            (err) => err ? reject(err) : resolve()
                        );
                    })
                );
            }

            // Добавляем запросы для студентов
            if (studentsArray.length > 0) {
                const studentValues = studentsArray.map(studentId => [eventId, studentId]);
                queries.push(
                    new Promise((resolve, reject) => {
                        db.query('INSERT INTO event_students (event_id, student_id) VALUES ?',
                            [studentValues],
                            (err) => err ? reject(err) : resolve()
                        );
                    })
                );
            }

            // Выполняем все запросы и завершаем транзакцию
            Promise.all(queries)
                .then(() => {
                    db.commit(err => {
                        if (err) return rollback(res, err);
                        res.json({ message: 'Event created successfully!', eventId });
                    });
                })
                .catch(err => rollback(res, err));
        });
    });
});

async function getFilteredEvents(query) {
    return new Promise((resolve, reject) => {
        let sql = `
            SELECT 
                e.id,
                e.full_name,
                e.event_date,
                e.location,
                el.name AS event_level,
                rl.name AS result_level,
                e.photo_path,
                (SELECT GROUP_CONCAT(full_name) 
                 FROM teachers t 
                 JOIN event_teachers et ON t.id = et.teacher_id 
                 WHERE et.event_id = e.id) AS teachers,
                (SELECT GROUP_CONCAT(full_name) 
                 FROM students s 
                 JOIN event_students es ON s.id = es.student_id 
                 WHERE es.event_id = e.id) AS students
            FROM events e
            JOIN event_levels el ON e.event_level_id = el.id
            JOIN result_levels rl ON e.result_level_id = rl.id
        `;

        const filters = [];
        const params = [];

        if (query.startDate) {
            filters.push('e.event_date >= ?');
            params.push(query.startDate);
        }
        if (query.endDate) {
            filters.push('e.event_date <= ?');
            params.push(query.endDate);
        }
        if (query.eventLevel) {
            filters.push('e.event_level_id = ?');
            params.push(query.eventLevel);
        }
        if (query.resultLevel) {
            filters.push('e.result_level_id = ?');
            params.push(query.resultLevel);
        }

        if (filters.length > 0) {
            sql += ' WHERE ' + filters.join(' AND ');
        }

        sql += ' ORDER BY e.event_date DESC';

        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

// Вспомогательная функция для отката транзакции
function rollback(res, err) {
    db.rollback(() => {
        res.status(500).json({ error: err.message });
    });
}
function authMiddleware(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Требуется авторизация' });
    }
}

app.get('/api/events', authMiddleware, (req, res) => {
    let sql = `
        SELECT
            e.id,
            e.full_name,
            e.event_date,
            e.location,
            el.name AS event_level,
            rl.name AS result_level,
            e.photo_path,
            (SELECT GROUP_CONCAT(t.full_name)
             FROM event_teachers et
                      JOIN teachers t ON et.teacher_id = t.id
             WHERE et.event_id = e.id) AS teachers,
            (SELECT GROUP_CONCAT(s.full_name)
             FROM event_students es
                      JOIN students s ON es.student_id = s.id
             WHERE es.event_id = e.id) AS students
        FROM events e
                 JOIN event_levels el ON e.event_level_id = el.id
                 JOIN result_levels rl ON e.result_level_id = rl.id
    `;

    const filters = [];
    const params = [];

    // Фильтр по датам
    if (req.query.startDate) {
        filters.push('e.event_date >= ?');
        params.push(req.query.startDate);
    }
    if (req.query.endDate) {
        filters.push('e.event_date <= ?');
        params.push(req.query.endDate);
    }

    // Фильтр по уровню
    if (req.query.eventLevel) {
        filters.push('e.event_level_id = ?');
        params.push(req.query.eventLevel);
    }

    // Фильтр по результату
    if (req.query.resultLevel) {
        filters.push('e.result_level_id = ?');
        params.push(req.query.resultLevel);
    }

    if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
    }

    sql += ' ORDER BY e.event_date DESC';

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(result);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("API_BASE_URL:", API_BASE_URL);
    console.log("Full teachers URL:", `${API_BASE_URL}/api/teachers`);
});
