const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("name email");
  res.json(user);
};

exports.getProfile = async (req, res) => {
  console.log("👉 GET PROFILE HIT");
  const profile = await UserProfile.findOne({ user: req.user.id });
  console.log("PROFILE:", profile);

  if (!profile) {
    return res.json(null); // frontend expects this
  }

  res.json(profile);
};

exports.createProfile = async (req, res) => {
  console.log("👉 CREATE PROFILE HIT");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const exists = await UserProfile.findOne({ user: req.user.id });
    console.log("EXISTS:", exists);

    if (exists) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const profile = await UserProfile.create({
      user: req.user.id,
      ...req.body,
    });

    console.log("CREATED:", profile);
    res.status(201).json(profile);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ message: "Profile creation failed" });
  }
};


exports.updateProfile = async (req, res) => {
  console.log("👉 UPDATE PROFILE HIT");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const profile = await UserProfile.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, upsert: true }
    );

    console.log("UPDATED:", profile);
    res.json(profile);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

