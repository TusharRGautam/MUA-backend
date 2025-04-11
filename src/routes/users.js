const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

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

    // Create user profile in Supabase database
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          full_name: fullName,
          email,
          phone_number: phoneNumber
        }
      ]);

    if (profileError) {
      console.error('Profile Creation Error:', profileError);
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

module.exports = router;