import Queue from "../models/queueModel";
import Staff from "../models/staffModel";

// Queue Status type definition
type QueueStatus = "waiting" | "in-progress" | "served" | "cancelled";

// Helper function for local date
const getLocalDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
};

// Function to book a queue for a user with a specific staff member
export const bookQueue = async (userId: string, staffId: string) => {
  const today = getLocalDate();

  const staff = await Staff.findById(staffId);
  if (!staff) throw new Error("Staff not found.");

  const existingQueue = await Queue.findOne({
    userId,
    date: today,
    status: { $in: ["waiting", "in-progress"] },
  });
  if (existingQueue) throw new Error("You already have a booking for today.");

  const queuePosition =
    (await Queue.countDocuments({ staffId, date: today })) + 1;

  const newQueue = new Queue({
    userId,
    staffId,
    status: "waiting",
    date: today,
  });

  await newQueue.save();

  return {
    queueNumber: queuePosition,
    staffName: staff.name,
  };
};

// Function to cancel today's queue for a user
export const cancelQueue = async (userId: string) => {
  const today = getLocalDate();

  const queue = await Queue.findOneAndUpdate(
    {
      userId,
      date: today,
      status: { $in: ["waiting", "in-progress"] },
    },
    { status: "cancelled", updatedAt: new Date() },
    { new: true }
  );

  return queue;
};

// Get queue status for a user
export const getQueueStatus = async (userId: string) => {
  const today = getLocalDate();

  const userQueue = await Queue.findOne({
    userId,
    date: today,
    status: { $in: ["waiting", "in-progress"] },
  }).populate("staffId");

  if (!userQueue?.staffId || typeof userQueue.staffId === "string") return null;

  const staff = userQueue.staffId as typeof Staff.prototype;
  const allQueues = await Queue.find({
    staffId: staff._id,
    date: today,
  }).sort({ _id: 1 });

  const yourIndex = allQueues.findIndex(
    (q) => q._id.toString() === userQueue._id.toString()
  );
  const currentInProgress = allQueues.find((q) => q.status === "in-progress");

  return {
    yourPosition: yourIndex + 1,
    peopleAhead: allQueues
      .slice(0, yourIndex)
      .filter((q) => ["waiting", "in-progress"].includes(q.status)).length,
    staffName: staff.name,
    currentQueueNumber: currentInProgress
      ? allQueues.findIndex(
          (q) => q._id.toString() === currentInProgress._id.toString()
        ) + 1
      : null,
  };
};

// Get active queues for a specific staff
export const getActiveQueuesForStaff = async (staffId: string) => {
  const today = getLocalDate();

  const allQueues = await Queue.find({
    staffId,
    date: today,
  })
    .sort({ createdAt: 1 })
    .populate("userId");

  const allQueuesWithPosition = allQueues.map((q, index) => ({
    ...q.toObject(),
    queueNumber: index + 1,
  }));

  const activeQueues = allQueuesWithPosition.filter(
    (q) => !["cancelled", "served"].includes(q.status)
  );

  return activeQueues;
};

// Update the status of a queue
export const updateQueueStatus = async (
  queueId: string,
  newStatus: QueueStatus
) => {
  const queue = await Queue.findById(queueId);
  if (!queue) return null;

  queue.status = newStatus;
  await queue.save();

  const updatedQueues = await getActiveQueuesForStaff(queue.staffId.toString());
  const updatedQueueWithNumber = updatedQueues.find(
    (q) => q._id.toString() === queueId
  );

  return updatedQueueWithNumber || queue;
};
