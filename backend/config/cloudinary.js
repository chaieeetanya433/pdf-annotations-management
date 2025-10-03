const cloudinary = require('cloudinary').v2;

console.log('cloud_name: ', process.env.CLOUDINARY_CLOUD_NAME);
console.log('api_key: ', process.env.CLOUDINARY_API_KEY);
console.log('api_secret: ', process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "depj4rnns",
    api_key: process.env.CLOUDINARY_API_KEY || "313655615577867",
    api_secret: process.env.CLOUDINARY_API_SECRET || "GuStQnbt3yXTniD61jZE11L6tZU"
});

module.exports = cloudinary;
