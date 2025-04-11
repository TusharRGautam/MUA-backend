const { pool } = require('../config/database');

class Product {
  static async getAllProducts() {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return result.rows;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProductById(id) {
    try {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  static async getProductsByCategory(category) {
    try {
      const result = await pool.query('SELECT * FROM products WHERE category = $1', [category]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  }
}

module.exports = Product;