/**
 * Transformation Controller
 * 
 * Google Drive functionality removed - using ImageKit instead
 * Please use ImageKit routes for transformation image uploads
 */

// Export empty controller - use ImageKit routes instead
module.exports = {
  uploadTransformationImage: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive transformation upload removed. Please use ImageKit routes for transformation image uploads.',
      redirect: '/api/imagekit/upload'
    });
  },
  
  saveTransformation: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive transformation functionality removed. Please use ImageKit routes.',
      redirect: '/api/imagekit/upload'
    });
  },
  
  getTransformations: async (req, res) => {
    // This could still work with database queries if needed
    return res.status(200).json({
      success: true,
      message: 'Transformation functionality moved to ImageKit routes',
      transformations: []
    });
  },
  
  deleteTransformation: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive transformation functionality removed. Please use ImageKit routes.',
      redirect: '/api/imagekit/upload'
    });
  },
  
  findOrCreateUserTransformationFolder: () => {
    console.log('Google Drive transformation folder functionality removed');
    return null;
  }
};