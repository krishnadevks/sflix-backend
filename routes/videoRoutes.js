const express = require("express");
const multer = require("multer");
const { uploadToR2 } = require("../Uploadserver");
const fs = require("fs").promises;
const path = require("path");
const admin = require("firebase-admin");

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
(async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error("Error creating uploads directory:", err);
  }
})();

const videoRoutes = (db) => {
  const router = express.Router();
  const videosCollection = db.collection("videos");

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const upload = multer({ storage });

  // Video Upload Route
  router.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const { title, description } = req.body;

      // Validate input
      if (!title || !description || !req.file) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Upload to Cloudflare R2
      const result = await uploadToR2(req.file.path, req.file.filename);

      // Construct the desired public URL
      const publicUrl = `https://pub-6dd4b238315b4e83bc98ef3f35507357.r2.dev/upload/${req.file.filename}`;

      if (!result.Location || !publicUrl) {
        throw new Error("Failed to retrieve file URL from R2");
      }

      // Clean up the local file
      await fs.unlink(req.file.path);

      // Prepare video metadata for Firestore
      const videoData = {
        title,
        description,
        fileUrl: publicUrl, // Use the updated public URL here
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Save metadata to Firestore
      const docRef = await videosCollection.add(videoData);

      // Respond with the video data
      res.status(201).json({
        message: "Video uploaded successfully",
        videoId: docRef.id,
        video: videoData,
      });
    } catch (error) {
      console.error("Error during upload:", error);
      res
        .status(500)
        .json({ message: "Error uploading video", error: error.message });
    }
  });

  // Fetch video list
  router.get("/videos", async (req, res) => {
    try {
      // Query Firestore for the video collection
      const snapshot = await videosCollection
        .orderBy("createdAt", "desc")
        .get();
      const videos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res
        .status(500)
        .json({ message: "Error fetching videos", error: error.message });
    }
  });

  // Delete video metadata route (without deleting the video from Cloudflare R2)
  router.delete("/video/delete/:id", async (req, res) => {
    const { id } = req.params;

    try {
      // Log the incoming request
      console.log("Deleting video metadata with ID:", id);

      // Delete the video's metadata from Firebase
      const docRef = videosCollection.doc(id);
      await docRef.delete();
      console.log("Deleted metadata from Firestore.");

      // Respond with success message
      res.status(200).json({ message: "Video metadata deleted successfully" });
    } catch (error) {
      console.error("Error deleting video metadata:", error);
      res.status(500).json({ message: "Failed to delete video metadata" });
    }
  });

  return router;
};

module.exports = videoRoutes;
