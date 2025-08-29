/**
 * User Controller
 * 
 * Google Drive functionality removed - using ImageKit instead
 * Please use ImageKit routes for profile picture uploads
 */

// Export empty controller - use ImageKit routes instead
module.exports = {
  uploadProfilePicture: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive upload removed. Please use ImageKit routes for profile picture uploads.',
      redirect: '/api/imagekit/upload'
    });
  }
};