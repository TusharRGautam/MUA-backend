/**
 * Gallery Controller
 * 
 * Google Drive functionality removed - using ImageKit instead
 * Please use ImageKit routes for gallery image uploads
 */

// Export empty controller - use ImageKit routes instead
module.exports = {
  uploadGalleryImage: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive gallery upload removed. Please use ImageKit routes for gallery image uploads.',
      redirect: '/api/imagekit/upload'
    });
  },
  
  saveGalleryImage: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive gallery functionality removed. Please use ImageKit routes.',
      redirect: '/api/imagekit/upload'
    });
  },
  
  getGalleryImages: async (req, res) => {
    // This could still work with database queries if needed
    return res.status(200).json({
      success: true,
      message: 'Gallery functionality moved to ImageKit routes',
      images: []
    });
  },
  
  deleteGalleryImage: (req, res) => {
    return res.status(200).json({
      success: false,
      message: 'Google Drive gallery functionality removed. Please use ImageKit routes.',
      redirect: '/api/imagekit/upload'
    });
  }
};