const cloudinary = require("cloudinary").v2;

  // Configuration
  cloudinary.config({
    cloud_name: "dafebdran",
    api_key: "865286188572755",
    api_secret:
      "4avR_VQwILBjfeSkFSN69rtw7dk",
  });

  const generateCloudinaryFileName = (nombre, apellido) => {
    const formattedName = `${nombre}_${apellido}`.replace(/\s+/g, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${formattedName}_${timestamp}`;
  };

  module.exports = {cloudinary, generateCloudinaryFileName};


