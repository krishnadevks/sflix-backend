const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const videoRoutes = require("./routes/videoRoutes");
const authRoutes = require("./routes/authRoutes");
const { db } = require("./firebase");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(videoRoutes(db));

app.use("/auth", authRoutes(db));
app.use("/video", videoRoutes(db));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
