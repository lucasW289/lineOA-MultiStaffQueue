import mongoose from "mongoose";
import dotenv from "dotenv";
import Queue from "../models/queueModel";

dotenv.config();

const mongoUri = process.env.MONGO_URI!;
const baseTime = new Date("2025-04-23T08:00:00.000Z");

function minutesLater(start: Date, minutes: number): Date {
  return new Date(start.getTime() + minutes * 60000);
}

const staffIds = {
  alice: new mongoose.Types.ObjectId("6806f4d4e5bc7551a4e3fdf7"),
  bob: new mongoose.Types.ObjectId("6806f4d4e5bc7551a4e3fdf8"),
  charlie: new mongoose.Types.ObjectId("6806f4d4e5bc7551a4e3fdf9"),
};

const today = "2025-04-23";

let currentTime = new Date(baseTime); // Start time

const createQueueEntry = (
  userId: string,
  staffId: mongoose.Types.ObjectId,
  status: "waiting" | "in-progress" | "cancelled" | "served"
) => {
  const createdAt = new Date(currentTime);
  const updatedAt =
    status === "waiting"
      ? createdAt
      : minutesLater(createdAt, Math.floor(Math.random() * 5 + 2)); // 2–6 mins later
  currentTime = minutesLater(currentTime, Math.floor(Math.random() * 10 + 5)); // 5–15 mins gap before next entry

  return {
    userId,
    staffId,
    status,
    date: today,
    createdAt,
    updatedAt,
  };
};

const queueData = [
  // Alice (4)
  createQueueEntry("U001", staffIds.alice, "in-progress"),
  createQueueEntry("U002", staffIds.alice, "waiting"),
  createQueueEntry("U003", staffIds.alice, "cancelled"),
  createQueueEntry("U004", staffIds.alice, "waiting"),

  // Bob (3)
  createQueueEntry("U005", staffIds.bob, "waiting"),
  createQueueEntry("U006", staffIds.bob, "waiting"),
  createQueueEntry("U007", staffIds.bob, "waiting"),

  // Charlie (2)
  createQueueEntry("U008", staffIds.charlie, "waiting"),
  createQueueEntry("U009", staffIds.charlie, "waiting"),
];

async function seedQueue() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    await Queue.deleteMany(); // Clear existing queues

    const result = await Queue.insertMany(queueData);
    console.log(`✅ Inserted ${result.length} queue entries`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seedQueue();
