const express = require('express');
const app = express();
require('dotenv').config();

const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'clave_predeterminada';

// Conexión a MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error al conectar a MongoDB:', err);
  }
}

connectDB();


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_secreto_sesion',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 86400000 }
}));

// Importar rutas y middleware
const productsRoutes = require('./routes/products');
const { router: authRouter } = require('./routes/auth');

// Middleware para verificar token desde cookie
function verificarToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.redirect('/login');
  }
}

// Rutas de autenticación (API)
app.use('/api/auth', authRouter);

// Rutas de productos (API)
app.use('/api/products', productsRoutes);

// Vistas públicas
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Vistas protegidas (requieren autenticación)
app.get('/add', verificarToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'add.html'));
});

app.get('/edit', verificarToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'edit.html'));
});

// Página de inicio (accesible sin autenticación)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Ruta de prueba para verificar que Render responde correctamente
app.get('/prueba', (req, res) => {
  res.send('✅ Render está funcionando correctamente');
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));