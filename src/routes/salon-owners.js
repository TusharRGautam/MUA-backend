const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all salon owners
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM salonestoreowner
      ORDER BY rating DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching salon owners:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get popular salon owners - limited to top 5 by rating
router.get('/popular', async (req, res) => {
  try {
    console.log('Popular salon owners route hit (from router)');
    const result = await db.query(`
      SELECT * FROM salonestoreowner
      ORDER BY rating DESC
      LIMIT 5
    `);
    
    console.log('Found popular salon owners:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching popular salon owners:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get salon owner by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM SaloneStoreOwner
      WHERE id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salon owner not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching salon owner by ID:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get salon owners by city
router.get('/city/:city', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM SaloneStoreOwner
      WHERE LOWER(city) = LOWER($1)
      ORDER BY rating DESC
    `, [req.params.city]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching salon owners by city:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get salon owners by speciality
router.get('/speciality/:speciality', async (req, res) => {
  try {
    // Using LIKE for partial matching
    const result = await db.query(`
      SELECT * FROM SaloneStoreOwner
      WHERE LOWER(speciality) LIKE LOWER($1)
      ORDER BY rating DESC
    `, [`%${req.params.speciality}%`]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching salon owners by speciality:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 