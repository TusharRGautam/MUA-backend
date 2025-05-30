const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for uploading profile picture
router.post('/profile-picture', userController.uploadProfilePicture);

module.exports = router; 