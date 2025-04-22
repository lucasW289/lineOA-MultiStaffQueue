// server.ts

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
//import staffRoutes from "./routes/staffRoute";
import webHookRoutes from "./routes/webhookRoute";

dotenv.config();
const mongoUri = process.env.MONGO_URI || "";

console.log("MONGO_URI from .env:", process.env.MONGO_URI);

const app = express();

// Middleware to parse JSON body
app.use(express.json());

app.use("/webhook", webHookRoutes);
// Use the staff routes
//app.use("/api", staffRoutes);

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
