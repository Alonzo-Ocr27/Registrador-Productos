const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// ✅ Importar middleware desde tu archivo middleware/auth.js
const { verificarTokenDesdeCookie, authorizeRoles } = require('../middlewares/auth');

// Obtener todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Agregar producto (admin, capturador)
router.post(
  '/',
  verificarTokenDesdeCookie,
  authorizeRoles('admin', 'capturador'),
  async (req, res) => {
    try {
      const { name, category, quantity, status, provider } = req.body;
      const product = new Product({
        name,
        category,
        quantity,
        status,
        provider,
        date: new Date().toISOString()
      });
      await product.save();
      res.status(201).json({ message: 'Producto guardado', product });
    } catch (err) {
      res.status(500).json({ error: 'Error al guardar el producto' });
    }
  }
);

// Editar producto (solo admin)
router.put(
  '/:id',
  verificarTokenDesdeCookie,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { name, category, quantity, status, provider } = req.body;
      await Product.findByIdAndUpdate(req.params.id, { name, category, quantity, status, provider });
      res.json({ message: 'Producto actualizado' });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar el producto' });
    }
  }
);

// Obtener producto por ID (para cargar al editar)
router.get(
  '/:id',
  verificarTokenDesdeCookie,
  authorizeRoles('admin', 'capturador'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).lean();
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  }
);

// Eliminar producto (solo admin)
router.delete(
  '/:id',
  verificarTokenDesdeCookie,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: 'Producto eliminado' });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar el producto' });
    }
  }
);

module.exports = router;
