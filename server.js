// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'add.html'));
});

app.get('/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'edit.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
 console.log( ` Servidor corriendo en: http://localhost:${PORT} `)
});
