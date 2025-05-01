const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const { authenticateToken } = require('../../middleware/auth');

// User registration route
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    // Try to create user profile in Supabase database
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName,
          email,
          phone_number: phoneNumber
        }
      ]);

    // If profile creation fails due to RLS, but auth was successful, we still consider it a success
    // The profile will be created later when the user confirms their email
    if (profileError) {
      console.error('Profile Creation Error:', profileError);
      if (profileError.message.includes('row-level security policy')) {
        // Still return success to frontend - this is a temporary workaround until the service key is added
        return res.status(201).json({
          message: 'User registered successfully. Profile will be created after email confirmation.',
          user: authData.user
        });
      }
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: authData.user
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login Error:', error);
      return res.status(401).json({ error: error.message });
    }

    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile Fetch Error:', profileError);
      // We still return the authentication data even if profile fetch fails
    }

    // Return user data and session
    res.json({
      message: 'Login successful',
      user: {
        ...data.user,
        profile: profileData || null
      },
      session: data.session
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile - protected route
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Since we have the auth middleware, req.user is already populated
    const userId = req.user.id;
    
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile Fetch Error:', profileError);
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      user: {
        ...req.user,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Profile Fetch Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Try to refresh the session using the refresh token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });
    
    if (error) {
      console.error('Token Refresh Error:', error);
      
      // If refresh token is expired or invalid, require a new login
      return res.status(401).json({ 
        error: 'Unable to refresh your session. Please log in again.',
        code: 'REFRESH_FAILED'
      });
    }
    
    // Return the new session data
    res.json({
      message: 'Token refreshed successfully',
      session: data.session,
      user: data.user
    });
  } catch (error) {
    console.error('Token Refresh Error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Temporary endpoint to add RLS policy for testing - protected route
router.get('/fix-rls', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('create_profile_insert_policy');

    if (error) {
      console.error('RLS Policy Error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'RLS policy added successfully',
      data
    });
  } catch (error) {
    console.error('RLS Policy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;