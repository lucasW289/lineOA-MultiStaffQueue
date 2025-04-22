// src/seeds/seedStaff.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Staff from "../models/staffModel";

dotenv.config();

const mongoUri = process.env.MONGO_URI!;
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");

    await Staff.deleteMany({}); // Clear existing data

    const staff = await Staff.insertMany([
      { name: "Alice", role: "Receptionist" },
      { name: "Bob", role: "Dentist" },
      { name: "Charlie", role: "Nurse" },
    ]);

    console.log("Inserted staff:", staff);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
