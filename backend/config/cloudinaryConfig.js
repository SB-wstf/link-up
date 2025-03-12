import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import cloudinary from "cloudinary"; // Ensure you've imported Cloudinary

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the directory to store screenshots
const screenshotsDir = path.join(__dirname, "screenshots");

// Ensure the directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

cloudinary.config({
  cloud_name: "dopb0qzkh",
  api_key: "698597914127831",
  api_secret: "m6YgZCA2ilR1MFSH2-hhd19jrxw",
});

const uploadToCloudinary = (localFilePath) => {
  return new Promise((resolve, reject) => {
    const expiryTime = Math.floor(Date.now() / 1000) + 86400;

    cloudinary.v2.uploader.upload(
      localFilePath,
      {
        folder: "auto-updator",
        expire_at: expiryTime,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          fs.unlinkSync(localFilePath);
          resolve(result.secure_url);
        }
      }
    );
  });
};

export { uploadToCloudinary };
