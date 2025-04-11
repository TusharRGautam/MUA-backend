const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all makeup artists with their services and portfolio
router.get('/', async (req, res) => {
  try {
    const { data: artists, error: artistsError } = await supabase
      .from('makeup_artists')
      .select(`
        *,
        services(*),
        portfolio_images(*)
      `);

    if (artistsError) throw artistsError;
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get artist details by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: artist, error: artistError } = await supabase
      .from('makeup_artists')
      .select(`
        *,
        services(*),
        portfolio_images(*),
        reviews(*, customer:customers(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (artistError) throw artistError;
    res.json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get featured artists
router.get('/featured', async (req, res) => {
  try {
    const { data: artists, error: artistsError } = await supabase
      .from('makeup_artists')
      .select(`
        *,
        services(*),
        portfolio_images(*)
      `)
      .eq('is_featured', true);

    if (artistsError) throw artistsError;
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;