import { Request, Response } from "express";
import { replyFlexMessage, replyText } from "../services/lineService";
import { getAllStaff } from "../services/staffService";
import {
  bookQueue,
  cancelQueue,
  getQueueStatus,
} from "../services/queueService";

export const handleWebhook = async (req: Request, res: Response) => {
  const events = req.body.events;

  for (const event of events) {
    if (!event || !event.type) continue;

    const replyToken = event.replyToken;

    // Handle "book_queue" trigger
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "Join a Queue"
    ) {
      const staffList = await getAllStaff();

      const bubbles = staffList.map((staff) => ({
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: staff.name,
              weight: "bold",
              size: "lg",
              margin: "md",
            },
            {
              type: "text",
              text: staff.role,
              size: "sm",
              color: "#888888",
              margin: "md",
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "primary",
              height: "sm",
              action: {
                type: "message",
                label: "Book",
                text: `book ${staff.name}`,
              },
            },
          ],
        },
      }));

      const flexContent = {
        type: "carousel",
        contents: bubbles,
      };

      await replyFlexMessage(replyToken, flexContent);
      continue;
    }

    // Handle booking
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text.startsWith("book ")
    ) {
      const staffName = event.message.text.replace("book ", "");
      const userId = event.source.userId;
      const staff = await getAllStaff();
      const staffMember = staff.find((s) => s.name === staffName);

      if (!staffMember) {
        await replyText(
          userId,
          "Sorry, the staff member you selected doesn't exist."
        );
        continue;
      }

      try {
        const result = await bookQueue(userId, staffMember._id.toString());

        if (result) {
          const message = `You have successfully booked the queue with ${staffName}. Your queue number is ${result.queueNumber}.`;
          await replyText(userId, message);
        } else {
          await replyText(
            userId,
            "Sorry, we couldn't book your queue at the moment."
          );
        }
      } catch (error: unknown) {
        console.error("Queue Booking Error:", error);

        if (error instanceof Error) {
          await replyText(
            userId,
            error.message || "There was an error processing your queue request."
          );
        } else {
          await replyText(userId, "An unknown error occurred.");
        }
      }

      continue;
    }

    // Handle cancel request
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "Cancel My Queue"
    ) {
      const userId = event.source.userId;

      try {
        const cancelled = await cancelQueue(userId);

        if (cancelled) {
          await replyText(
            userId,
            "Your queue has been cancelled successfully."
          );
        } else {
          await replyText(
            userId,
            "You don't have any active bookings to cancel."
          );
        }
      } catch (error) {
        console.error("Queue Cancel Error:", error);
        await replyText(
          userId,
          "Something went wrong while cancelling your queue."
        );
      }

      continue;
    }

    //Checking Queue
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "View My Queue"
    ) {
      const userId = event.source.userId;
      console.log("I am here");

      try {
        const status = await getQueueStatus(userId);

        if (!status) {
          await replyText(
            userId,
            "You don't have any active queues right now."
          );
        } else {
          const message =
            `📋 Queue Status for ${status.staffName}:\n` +
            `Your queue number: ${status.yourPosition}\n` +
            (status.currentQueueNumber
              ? `Currently serving: #${status.currentQueueNumber}`
              : `There is no one to be served before you. Please wait for your number to be called up`);
          await replyText(userId, message);
        }
      } catch (error) {
        await replyText(
          userId,
          "Something went wrong while fetching your queue status."
        );
      }
    }
  }

  res.sendStatus(200);
};
