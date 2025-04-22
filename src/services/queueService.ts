import Queue from "../models/queueModel";
import Staff from "../models/staffModel";

// Function to book a queue for a user with a specific staff member
export const bookQueue = async (userId: string, staffId: string) => {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

  // Check if the staff exists
  const staff = await Staff.findById(staffId);
  if (!staff) {
    throw new Error("Staff not found.");
  }

  // Check if the user already has an ongoing queue with any staff for today
  const existingQueue = await Queue.findOne({
    userId,
    date: today,
    status: { $in: ["waiting", "in-progress"] },
  });
  if (existingQueue) {
    throw new Error("You already have a booking for today.");
  }

  // Calculate the current queue position for the selected staff
  const queuePosition =
    (await Queue.countDocuments({ staffId, date: today })) + 1; // Get the current queue position for the staff

  // Create a new queue entry
  const newQueue = new Queue({
    userId,
    staffId,
    status: "waiting",
    date: today,
  });

  // Save the new queue entry
  await newQueue.save();

  return {
    queueNumber: queuePosition,
    staffName: staff.name,
  };
};

// Function to cancel today's queue for a user
export const cancelQueue = async (userId: string) => {
  const today = new Date().toISOString().split("T")[0];

  const queue = await Queue.findOneAndUpdate(
    {
      userId,
      date: today,
      status: { $in: ["waiting", "in-progress"] },
    },
    { status: "cancelled", updatedAt: new Date() },
    { new: true }
  );

  return queue; // null if not found
};

// Get queue status for a user
export const getQueueStatus = async (userId: string) => {
  const today = new Date().toISOString().split("T")[0];

  const userQueue = await Queue.findOne({
    userId,
    date: today,
    status: { $in: ["waiting", "in-progress"] },
  }).populate("staffId");

  if (
    !userQueue ||
    !userQueue.staffId ||
    typeof userQueue.staffId === "string"
  ) {
    return null;
  }

  const staff = userQueue.staffId as typeof Staff.prototype;
  const staffId = staff._id;

  // ✅ Get all queues for that staff today (any status), ordered by creation
  const allQueues = await Queue.find({
    staffId,
    date: today,
  }).sort({ _id: 1 });

  // ✅ Your position is your index in full queue list
  const yourPosition =
    allQueues.findIndex((q) => q._id.toString() === userQueue._id.toString()) +
    1;

  // ✅ Find the current in-progress queue
  const currentInProgress = allQueues.find((q) => q.status === "in-progress");

  return {
    yourPosition,
    staffName: staff.name,
    currentQueueNumber: currentInProgress
      ? allQueues.findIndex(
          (q) => q._id.toString() === currentInProgress._id.toString()
        ) + 1
      : null,
  };
};
