require("dotenv").config();
const mongoose = require("mongoose");
const Plan = require("./src/models/Plans");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected ✅");

    await Plan.deleteMany();

    await Plan.insertMany([
      {
        name: "Free Plan",
        price: 0,
        type: "free",
        features: [
          { text: "10 searches per day", included: true },
          { text: "Ads will be shown", included: true },
          { text: "No expert advice", included: false }
        ]
      },
      {
        name: "Premium Plan",
        price: 899,
        type: "premium",
        features: [
          { text: "Unlimited searches", included: true },
          { text: "No ads", included: true },
          { text: "No expert advice", included: false }
        ]
      },
      {
        name: "Pro Plan",
        price: 3999,
        type: "pro",
        features: [
          { text: "Unlimited access", included: true },
          { text: "Expert advice included", included: true },
          { text: "Business support access", included: true }
        ]
      }
    ]);

    console.log("Plans seeded successfully 🚀");
    process.exit();
  } catch (err) {
    console.error("Seeding error ❌", err);
    process.exit(1);
  }
}

seed();