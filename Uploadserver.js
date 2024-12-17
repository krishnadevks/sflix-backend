const dotenv = require("dotenv");
const fs = require("fs").promises;
const AWS = require("aws-sdk");

dotenv.config();

// Configure AWS S3 for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY, // Cloudflare R2 Access Key
  secretAccessKey: process.env.S3_SECRET_KEY, // Cloudflare R2 Secret Key
  region: "auto", // Region is set to auto for Cloudflare R2
  signatureVersion: "v4", // Signature version compatible with Cloudflare R2
});

/**
 * Uploads a video file to Cloudflare R2.
 *
 * @param {string} filePath - The local path of the video file.
 * @param {string} fileName - The name to be used for the file on Cloudflare R2.
 * @returns {object} - The response from the Cloudflare R2 upload.
 * @throws {Error} - Throws error if upload fails.
 */
const uploadToR2 = async (filePath, fileName) => {
  try {
    // Read the file from the file system
    const fileContent = await fs.readFile(filePath);

    // S3 parameters for Cloudflare R2
    const params = {
      Bucket: "upload", // Your Cloudflare R2 bucket name
      Key: fileName, // The name to use for the uploaded file
      Body: fileContent, // File content
      ACL: "public-read", // Set file to be publicly readable
      ContentType: "video/mp4", // Content type (adjust as needed)
    };

    // Upload the file to R2 using the AWS SDK
    const data = await s3.upload(params).promise();

    // If upload response is invalid, throw an error
    if (!data || !data.Location) {
      throw new Error("Upload to R2 failed or returned invalid response");
    }

    // Log success and return the data from the upload
    console.log("Upload successful:", data);
    return data;
  } catch (error) {
    // Handle any errors during upload
    console.error("Error uploading to R2:", error);
    throw new Error("Failed to upload file to R2");
  }
};

module.exports = { uploadToR2 };
