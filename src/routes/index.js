const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const usersRouter = require('./users');
const productsRouter = require('./products');
const artistsRouter = require('./artists');
const businessRouter = require('./business');
const salonOwnersRouter = require('./salon-owners');

// Get all makeup artists
router.get('/artists', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('makeup_artists')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get artist portfolio images
router.get('/artists/:id/portfolio', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('artist_id', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get artist services
router.get('/artists/:id/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('artist_id', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get artist reviews
router.get('/artists/:id/reviews', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, customers(*)')
      .eq('artist_id', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register route handlers
router.use('/users', usersRouter);
router.use('/products', productsRouter);
router.use('/artists', artistsRouter);
router.use('/business', businessRouter);
router.use('/salon-owners', salonOwnersRouter);

module.exports = router;