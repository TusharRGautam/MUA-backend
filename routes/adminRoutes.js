const express = require('express');
const router = express.Router();

// Test route for admin
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin routes are working',
    timestamp: new Date().toISOString()
  });
});

// TODO: Add admin routes here
// router.get('/dashboard', ...);
// router.post('/users', ...);
// router.delete('/users/:id', ...);

module.exports = router;

