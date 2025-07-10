const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'clave_predeterminada';

// Verifica si hay token en cookies (para rutas API)
function verificarTokenDesdeCookie(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Puedes usar req.user.id y req.user.role luego
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Verifica si el usuario está autenticado con sesión (solo si usas sesiones)
function authMiddleware(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// Middleware de roles (opcional)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const role = req.session?.role || req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  };
}

module.exports = {
  verificarTokenDesdeCookie,
  authMiddleware,
  authorizeRoles
};