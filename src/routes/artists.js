const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get all makeup artists with their services and portfolio
router.get('/', async (req, res) => {
  try {
    // Get all makeup artists
    const { data: artists, error: artistsError } = await supabase
      .from('makeup_artists')
      .select('*');

    if (artistsError) throw artistsError;

    // For each artist, fetch their services and portfolio separately
    const artistsWithDetails = await Promise.all(
      artists.map(async (artist) => {
        // Get services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('artist_id', artist.id);

        // Get portfolio images
        const { data: portfolio, error: portfolioError } = await supabase
          .from('portfolio_images')
          .select('*')
          .eq('artist_id', artist.id);

        return {
          ...artist,
          services: servicesError ? [] : services,
          portfolio_images: portfolioError ? [] : portfolio
        };
      })
    );

    res.json(artistsWithDetails);
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get featured artists - MOVED BEFORE /:id route to prevent route conflicts
router.get('/featured', async (req, res) => {
  try {
    // Get all artists since is_featured column doesn't exist
    // For a real app, we would add the column, but for now let's return the top 3 artists
    const { data: artists, error: artistsError } = await supabase
      .from('makeup_artists')
      .select('*')
      .limit(3); // Return the first 3 artists as "featured"

    if (artistsError) throw artistsError;

    // For each artist, fetch their services and portfolio separately
    const artistsWithDetails = await Promise.all(
      artists.map(async (artist) => {
        // Get services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('artist_id', artist.id);

        // Get portfolio images
        const { data: portfolio, error: portfolioError } = await supabase
          .from('portfolio_images')
          .select('*')
          .eq('artist_id', artist.id);

        return {
          ...artist,
          services: servicesError ? [] : services,
          portfolio_images: portfolioError ? [] : portfolio
        };
      })
    );

    res.json(artistsWithDetails);
  } catch (err) {
    console.error('Error fetching featured artists:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get artist details by ID
router.get('/:id', async (req, res) => {
  try {
    // Get the artist
    const { data: artist, error: artistError } = await supabase
      .from('makeup_artists')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (artistError) throw artistError;

    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('artist_id', req.params.id);

    // Get portfolio images
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('artist_id', req.params.id);

    // Get reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('artist_id', req.params.id);

    // If we have reviews, get customer details for each review
    let reviewsWithCustomer = [];
    if (!reviewsError && reviews.length > 0) {
      reviewsWithCustomer = await Promise.all(
        reviews.map(async (review) => {
          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', review.customer_id)
            .single();

          return {
            ...review,
            customer: customerError ? null : customer
          };
        })
      );
    }

    res.json({
      ...artist,
      services: servicesError ? [] : services,
      portfolio_images: portfolioError ? [] : portfolio,
      reviews: reviewsError ? [] : reviewsWithCustomer
    });
  } catch (err) {
    console.error('Error fetching artist details:', err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route to check table structure
router.get('/debug/schema', async (req, res) => {
  try {
    // Check if makeup_artists table exists and list its columns
    const { data, error } = await supabase
      .from('makeup_artists')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(500).json({
        error: error.message,
        hint: "The makeup_artists table might not exist"
      });
    }

    // Get the column names from the first row
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    res.json({
      tableExists: true,
      columns: columns,
      sample: data
    });
  } catch (err) {
    console.error('Error checking schema:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;