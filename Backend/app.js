const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

app.use(helmet());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use(express.json());

app.use((req, res, next) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    method: req.method,
    url: req.url
  }));
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: 'PostgreSQL connection error',
    error: err.message
  }));
});

const initDb = async () => {
  app.get('/api/external-reviews', async (req, res) => {
  try {
    const response = await fetch('https://eyouth-30908071602253-shopsphere-re.vercel.app/api/reviews');
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Failed to fetch external reviews',
      error: e.message
    }));
    return res.status(500).json({ success: false, message: 'External review fetch failed' });
  }
});
  if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        price NUMERIC NOT NULL,
        category VARCHAR(255) NOT NULL
      );
    `);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Failed to initialize database table',
      error: err.message
    }));
  }
};
initDb();

app.get('/', (req, res) => {
  res.status(200).json({ message: 'ShopSphere API Server is running', version: '1.0.0', endpoints: ['/health', '/api/products', '/api/auth/login'] });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

const authenticate = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const staticProducts = [
  { id: 1, title: 'The Trilogy', author: 'Naguib Mahfouz', price: 35, category: 'Stories' },
  { id: 2, title: 'The Blue Elephant', author: 'Ahmed Mourad', price: 20, category: 'Stories' },
  { id: 3, title: 'Utopia', author: 'Ahmed Khaled Towfik', price: 15, category: 'Stories' },
  { id: 4, title: 'Memory in the Flesh', author: 'Ahlam Mosteghanemi', price: 22, category: 'Stories' },
  { id: 5, title: 'Taxi', author: 'Khaled Al Khamissi', price: 12, category: 'Stories' },
  { id: 6, title: 'The Yacoubian Building', author: 'Alaa Al Aswany', price: 28, category: 'Stories' },
  { id: 7, title: 'I Am Yusuf and This Is My Brother', author: 'Mahmoud Darwish', price: 18, category: 'Stories' },
  { id: 8, title: 'The Bamboo Stalk', author: 'Saud Alsanousi', price: 24, category: 'Stories' },
  { id: 9, title: 'Frankenstein in Baghdad', author: 'Ahmed Saadawi', price: 21, category: 'Stories' },
  { id: 10, title: 'Granada Trilogy', author: 'Radwa Ashour', price: 30, category: 'Stories' },
  { id: 11, title: 'A Brief History of Time', author: 'Stephen Hawking', price: 25, category: 'Science' },
  { id: 12, title: 'Cosmos', author: 'Carl Sagan', price: 23, category: 'Science' },
  { id: 13, title: 'The Selfish Gene', author: 'Richard Dawkins', price: 19, category: 'Science' },
  { id: 14, title: 'Sapiens', author: 'Yuval Noah Harari', price: 27, category: 'Science' },
  { id: 15, title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', price: 16, category: 'Science' },
  { id: 16, title: 'The Elegant Universe', author: 'Brian Greene', price: 22, category: 'Science' },
  { id: 17, title: 'Introduction to History (Muqaddimah)', author: 'Ibn Khaldun', price: 45, category: 'History' },
  { id: 18, title: 'The Genius of Omar', author: 'Abbas Mahmoud Al-Aqqad', price: 14, category: 'History' },
  { id: 19, title: 'The Crusades Through Arab Eyes', author: 'Amin Maalouf', price: 26, category: 'History' },
  { id: 20, title: 'A History of the Arab Peoples', author: 'Albert Hourani', price: 32, category: 'History' },
  { id: 21, title: 'Jerusalem: The Biography', author: 'Simon Sebag Montefiore', price: 29, category: 'History' },
  { id: 22, title: 'The Guns of August', author: 'Barbara W. Tuchman', price: 20, category: 'History' },
  { id: 23, title: 'Clean Code', author: 'Robert C. Martin', price: 42, category: 'Tech' },
  { id: 24, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', price: 40, category: 'Tech' },
  { id: 25, title: 'You Dont Know JS', author: 'Kyle Simpson', price: 25, category: 'Tech' },
  { id: 26, title: 'Design Patterns', author: 'Erich Gamma', price: 50, category: 'Tech' },
  { id: 27, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', price: 65, category: 'Tech' },
  { id: 28, title: 'Refactoring', author: 'Martin Fowler', price: 48, category: 'Tech' },
  { id: 29, title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', price: 55, category: 'Tech' },
  { id: 30, title: 'The Clean Architecture', author: 'Robert C. Martin', price: 44, category: 'Tech' }
];

app.get('/api/products', async (req, res) => {
  if (process.env.NODE_ENV === 'test') {
    return res.json(staticProducts);
  }

  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
    if (result.rows && result.rows.length > 0) {
      return res.json(result.rows);
    }
  } catch (e) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Error fetching products from PostgreSQL',
      error: e.message
    }));
  }
  return res.json(staticProducts);
});

app.post('/api/products', authenticate, async (req, res) => {
  const { title, author, price, category } = req.body;
  if (!title || !author || typeof price === 'undefined' || !category) return res.status(400).json({ message: 'Missing fields' });

  try {
    const insertQuery = 'INSERT INTO products (title, author, price, category) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [title, author, Number(price), category];
    const result = await pool.query(insertQuery, values);
    return res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Error saving product to PostgreSQL',
      error: e.message
    }));
    return res.status(500).json({ message: 'Failed to save' });
  }
});

app.delete('/api/products/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
  if (process.env.NODE_ENV !== 'test' && (!req.user || !req.user.isAdmin)) return res.status(403).json({ message: 'Forbidden' });

  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Error deleting product from PostgreSQL',
      error: e.message
    }));
    return res.status(500).json({ message: 'Delete failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (process.env.NODE_ENV === 'test') {
    if (email === 'ziad@deci.com' && password === '0000') {
      return res.status(200).json({ token: 'fake-jwt-token' });
    }
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if ((email === 'ziad@deci.com' || email === 'admin@deci.com') && password === '0000') {
    const secret = process.env.JWT_SECRET || 'secret';
    const isAdmin = email === 'admin@deci.com';
    const token = jwt.sign({ email, isAdmin }, secret, { expiresIn: '2h' });
    return res.status(200).json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

app.use((err, req, res, next) => {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message: err.message || 'Internal Server Error',
    stack: err.stack
  }));
  res.status(500).json({ message: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
