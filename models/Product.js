const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, required: true },
  provider: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);