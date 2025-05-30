/**
 * Image Converter Utility
 * 
 * Provides functions for processing and converting images on the backend
 * Specifically designed to convert uploaded JPG/PNG images to WebP format
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuration
const DEFAULT_QUALITY = 80;
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'uploads', 'gallery');

/**
 * Ensures the output directory exists
 * @param {string} directory - Directory path to check/create
 */
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
};

/**
 * Convert an image file to WebP format
 * 
 * @param {string} inputPath - Path to input image file
 * @param {string} outputPath - Path for output WebP file
 * @param {Object} options - Conversion options
 * @param {number} options.quality - WebP quality (0-100)
 * @param {number} options.width - Max width for resizing
 * @returns {Promise<string>} - Path to the converted WebP file
 */
const convertToWebP = async (inputPath, outputPath, options = {}) => {
  try {
    console.log(`[convertToWebP] Converting ${inputPath} to WebP`);
    
    // Set default options
    const quality = options.quality || 80;
    const width = options.width || null;
    
    // Load the image using Sharp
    let sharpImage = sharp(inputPath);
    
    // Apply resizing if width is specified
    if (width) {
      sharpImage = sharpImage.resize({
        width: width,
        withoutEnlargement: true
      });
    }
    
    // Convert to WebP with specified quality
    await sharpImage
      .webp({ quality: quality })
      .toFile(outputPath);
    
    console.log(`[convertToWebP] Successfully converted to: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('[convertToWebP] Error converting image to WebP:', error);
    throw error;
  }
};

/**
 * Process a Base64 image string and convert to WebP
 * 
 * @param {string} base64String - Base64 encoded image data
 * @param {Object} options - Conversion options (same as convertToWebP)
 * @returns {Promise<string>} - Path to the converted WebP file
 */
const convertBase64ToWebP = async (base64String, options = {}) => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a temporary file path
    const tempDir = path.join(process.cwd(), 'temp');
    ensureDirectoryExists(tempDir);
    const tempPath = path.join(tempDir, `${uuidv4()}.tmp`);

    // Write the buffer to a temporary file
    fs.writeFileSync(tempPath, buffer);

    // Convert the temporary file to WebP
    const webpPath = await convertToWebP(tempPath, options);

    // Clean up the temporary file
    fs.unlinkSync(tempPath);

    return webpPath;
  } catch (error) {
    console.error('Error converting Base64 to WebP:', error);
    throw error;
  }
};

/**
 * Convert a buffer directly to WebP format in memory
 * 
 * @param {Buffer} imageBuffer - Buffer containing image data
 * @param {Object} options - Conversion options
 * @param {number} [options.quality] - WebP compression quality (1-100)
 * @param {boolean} [options.resize] - Whether to resize the image
 * @param {number} [options.width] - Target width if resizing
 * @param {number} [options.height] - Target height if resizing
 * @returns {Promise<Buffer>} - Buffer containing WebP image data
 */
const convertBufferToWebP = async (imageBuffer, options = {}) => {
  const {
    quality = DEFAULT_QUALITY,
    resize = false,
    width,
    height
  } = options;

  try {
    // Create a Sharp instance from the buffer
    let sharpInstance = sharp(imageBuffer);

    // Resize if requested
    if (resize && (width || height)) {
      sharpInstance = sharpInstance.resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to WebP and return the buffer
    const webpBuffer = await sharpInstance
      .webp({ quality })
      .toBuffer();

    console.log(`Converted buffer to WebP (${webpBuffer.length} bytes)`);
    return webpBuffer;
  } catch (error) {
    console.error('Error converting buffer to WebP:', error);
    throw error;
  }
};

/**
 * Convert a buffer to WebP and save to file
 * 
 * @param {Buffer} imageBuffer - Buffer containing image data
 * @param {Object} options - Conversion options
 * @param {string} [options.outputDir] - Directory to save the output file
 * @param {string} [options.filename] - Filename to use (without extension)
 * @param {number} [options.quality] - WebP compression quality (1-100)
 * @param {boolean} [options.resize] - Whether to resize the image
 * @param {number} [options.width] - Target width if resizing
 * @param {number} [options.height] - Target height if resizing
 * @returns {Promise<{path: string, buffer: Buffer}>} - Path to the saved WebP file and the buffer
 */
const convertBufferToWebPFile = async (imageBuffer, options = {}) => {
  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    filename = uuidv4(),
    quality = DEFAULT_QUALITY,
    resize = false,
    width,
    height
  } = options;

  try {
    // Ensure the output directory exists
    ensureDirectoryExists(outputDir);

    // Generate the output path
    const outputPath = path.join(outputDir, `${filename}.webp`);

    // Convert the buffer to WebP
    const webpBuffer = await convertBufferToWebP(imageBuffer, { quality, resize, width, height });

    // Write the buffer to file
    fs.writeFileSync(outputPath, webpBuffer);

    console.log(`Saved WebP image to: ${outputPath}`);
    return { path: outputPath, buffer: webpBuffer };
  } catch (error) {
    console.error('Error converting buffer to WebP file:', error);
    throw error;
  }
};

/**
 * Convert Base64 image string directly to WebP buffer
 * 
 * @param {string} base64String - Base64 encoded image data
 * @param {Object} options - Conversion options (same as convertBufferToWebP)
 * @returns {Promise<Buffer>} - Buffer containing WebP image data
 */
const convertBase64ToWebPBuffer = async (base64String, options = {}) => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Convert the buffer to WebP
    return await convertBufferToWebP(buffer, options);
  } catch (error) {
    console.error('Error converting Base64 to WebP buffer:', error);
    throw error;
  }
};

/**
 * Get a public URL for an image path
 * 
 * @param {string} imagePath - Path to the image file
 * @param {string} baseUrl - Base URL for the server
 * @returns {string} - Public URL for the image
 */
const getPublicImageUrl = (imagePath, baseUrl) => {
  if (!imagePath) return null;
  
  // Convert absolute path to relative path from project root
  const relativePath = imagePath.replace(process.cwd(), '');
  
  // Replace backslashes with forward slashes for URLs
  const normalizedPath = relativePath.replace(/\\/g, '/');
  
  // Combine with base URL
  return `${baseUrl}${normalizedPath}`;
};

module.exports = {
  convertToWebP,
  convertBase64ToWebP,
  convertBufferToWebP,
  convertBufferToWebPFile,
  convertBase64ToWebPBuffer,
  getPublicImageUrl
}; 