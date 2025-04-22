import mongoose from "mongoose";

const queueSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // The LINE user ID of the person in the queue
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Staff",
    required: true,
  }, // Reference to the staff member handling the user
  status: {
    type: String,
    enum: ["waiting", "in-progress", "served", "cancelled"], // Updated statuses
    default: "waiting", // Default status is 'waiting'
  },
  createdAt: { type: Date, default: Date.now }, // Date the user was added to the queue
  updatedAt: { type: Date, default: Date.now }, // Date the queue status was last updated
  date: { type: String, required: true }, // Queue date (YYYY-MM-DD)
});

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;
