const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const meRoutes = require("./routes/me");
const aiRoutes = require("./routes/aiRoutes");
const planRoutes = require("./routes/planRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", (req, res) => res.send("API is running"));

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/auth", require("./routes/adminAuth"));
app.use("/api/plans", planRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api", profileRoutes);
module.exports = app;