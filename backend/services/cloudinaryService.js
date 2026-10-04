const cloudinary = require('cloudinary').v2;

const isConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Upload an image buffer to Cloudinary (or fallback to Data URI if Cloudinary keys are unset)
 * @param {Buffer} buffer - image buffer
 * @param {string} mimeType - file mimetype (e.g. 'image/jpeg')
 * @param {string} folder - target Cloudinary folder
 * @returns {Promise<string>} image URL
 */
const uploadImageBuffer = (buffer, mimeType = 'image/jpeg', folder = 'kheti_samvaad') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary keys are configured in .env, upload to Cloudinary
    if (isConfigured()) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, crop: 'limit' }, // optimize for web
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload stream error:', error);
            // Fallback to data URI if upstream Cloudinary error occurs
            const base64 = buffer.toString('base64');
            return resolve(`data:${mimeType};base64,${base64}`);
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    } else {
      // Graceful fallback when Cloudinary keys are not yet provided in .env
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      resolve(dataUri);
    }
  });
};

module.exports = {
  uploadImageBuffer,
  isConfigured
};
