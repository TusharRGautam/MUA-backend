const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Route for uploading profile picture
router.post('/profile-picture', userController.uploadProfilePicture);

/**
 * Get user profile (works for both customers and vendors)
 * GET /api/user/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role === 'customer') {
      // Return customer profile
      const profileData = {
        id: user.id,
        custom_user_id: user.custom_user_id,
        full_name: user.full_name,
        fullName: user.full_name, // Also provide camelCase version
        email: user.email,
        phone_number: user.phone_number,
        phoneNumber: user.phone_number, // Also provide camelCase version
        role: user.role
      };
      
      res.json(profileData);
    } else if (user.role === 'business_owner' || user.role === 'vendor') {
      // Return vendor profile
      const profileData = {
        id: user.id,
        custom_user_id: user.custom_user_id,
        full_name: user.person_name,
        fullName: user.person_name, // Also provide camelCase version
        name: user.person_name,
        email: user.business_email || user.email,
        phone_number: user.phone_number,
        phoneNumber: user.phone_number, // Also provide camelCase version
        business_type: user.business_type,
        business_name: user.business_name,
        role: user.role
      };
      
      res.json(profileData);
    } else {
      res.status(400).json({ error: 'Invalid user role' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Get user bookings (works for both customers and vendors)
 * GET /api/user/bookings
 */
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { status = 'all' } = req.query;
    
    let bookingsQuery;
    let queryParams;
    
    if (user.role === 'customer') {
      // Get customer bookings
      bookingsQuery = `
        SELECT 
          b.*,
          v.person_name as vendor_name,
          v.business_name,
          v.business_type
        FROM salon_bookings b
        LEFT JOIN registration_and_other_details v ON b.vendor_id = v.sr_no
        WHERE b.customer_id = $1
      `;
      queryParams = [user.id];
      
      if (status !== 'all') {
        bookingsQuery += ' AND b.status = $2';
        queryParams.push(status);
      }
      
      bookingsQuery += ' ORDER BY b.created_at DESC';
    } else if (user.role === 'business_owner' || user.role === 'vendor') {
      // Get vendor bookings
      bookingsQuery = `
        SELECT 
          b.*,
          c.full_name as customer_name,
          c.phone_number as customer_phone
        FROM salon_bookings b
        LEFT JOIN Customer_Table_Details c ON b.customer_id = c.id
        WHERE b.vendor_id = $1
      `;
      queryParams = [user.id];
      
      if (status !== 'all') {
        bookingsQuery += ' AND b.status = $2';
        queryParams.push(status);
      }
      
      bookingsQuery += ' ORDER BY b.created_at DESC';
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
    const result = await query(bookingsQuery, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;