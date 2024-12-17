const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authRoutes = (db) => {
  const router = express.Router();
  const usersCollection = db.collection("users");

  // Sign Up Route
  router.post("/signup", async (req, res) => {
    const { email, password, role } = req.body; // 'role' can be 'user' or 'admin'

    try {
      const userDoc = await usersCollection.doc(email).get();
      if (userDoc.exists) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await usersCollection.doc(email).set({
        email,
        password: hashedPassword,
        role: role || "user",
      });

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  });

  // Login Route
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const userDoc = await usersCollection.doc(email).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = userDoc.data();
      const isPasswordValid = await bcrypt.compare(password, userData.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { email, role: userData.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.status(200).json({ token, role: userData.role });
    } catch (error) {
      res.status(500).json({ message: "Error logging in", error });
    }
  });

  return router;
};

module.exports = authRoutes;
