const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { body, validationResult } = require('express-validator'); // Importar express-validator
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta'; // Mejor usar .env
const { verificarTokenDesdeCookie, authorizeRoles } = require('../middlewares/auth');

//Rutas de autenticación

router.get('/user', verificarTokenDesdeCookie, (req, res) => {
  res.json({ username: req.user.username, role: req.user.role });
});

// Registrar usuario solo para admin
router.post(
  '/register',
  verificarTokenDesdeCookie,          // Verifica que esté autenticado
  authorizeRoles('admin'),             // Solo admin puede acceder
  [
    body('username').isString().notEmpty().withMessage('El nombre de usuario es requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').isString().notEmpty().withMessage('El rol es requerido')
  ],
  async (req, res) => {
    const errors = validationResult(req); // Verificar errores
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password, role } = req.body;
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      console.log('Datos recibidos:', { username, password, role });

      const user = new User({ username, password, role });
      await user.save();

      res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
      console.error('❌ Error al registrar usuario:', err);
      res.status(500).json({ error: 'Error en el servidor', details: err.message });
    }
  }
);

// Login usuario
router.post('/login', [
  body('username').isString().notEmpty().withMessage('El nombre de usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
  console.log('Iniciando el proceso de inicio de sesión'); // Mensaje de depuración

  const errors = validationResult(req); // Verificar errores
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    // Mensaje de depuración
    console.log(`Buscando usuario: ${username}`);
    
    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    // Mensaje de depuración
    console.log(`Contraseña ingresada: ${password}, Contraseña hashada: ${user.password}, Coincide: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Guardar datos en sesión
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.role = user.role;

    // Generar el token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Enviar token en cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Cambia a true si usas HTTPS
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Rutas GET para mostrar formularios
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/register.html'));
});

// Logout - cerrar sesión correctamente
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
      return res.status(500).send('❌ No se pudo cerrar la sesión');
    }

    res.clearCookie('token'); // Elimina también la cookie JWT
    res.redirect('/login');
  });
});

// Middleware para verificar token y extraer usuario
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user; // { id, role }
    next();
  });
}

module.exports = {
  router,
  authenticateToken,
};