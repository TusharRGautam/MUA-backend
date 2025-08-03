/**
 * Test server for PRP services API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const prpServiceRoutes = require('./routes/prpServiceRoutes');

const app = express();
const PORT = 3003; // Use port 3003 to avoid conflicts

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));

// PRP Services routes
app.use('/api/prp-services', prpServiceRoutes);

// Status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 'online' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`[PRP SERVER] Server running on http://localhost:${PORT}`);
  console.log(`[PRP SERVER] PRP services API available at http://localhost:${PORT}/api/prp-services`);
});