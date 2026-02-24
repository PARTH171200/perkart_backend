const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

// GET ALL USERS
router.get("/users", auth, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/users/:id", auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/users/:id", auth, admin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/search", auth, admin, async (req, res) => {
  try {
    const { query } = req.query;

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", auth, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    res.json({
      success: true,
      totalUsers,
      todayUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/growth/monthly", auth, admin, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const monthlyData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": 1 },
      },
    ]);

    // Convert to full 12 months format
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const formattedData = months.map((month, index) => {
      const found = monthlyData.find(m => m._id === index + 1);
      return {
        month,
        users: found ? found.count : 0,
      };
    });

    res.json({
      success: true,
      year,
      data: formattedData,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;