const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const meRoutes = require("./routes/me");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", (req, res) => res.send("API is running"));

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);

module.exports = app;
