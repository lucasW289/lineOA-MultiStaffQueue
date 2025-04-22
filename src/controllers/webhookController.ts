import { Request, Response } from "express";
import { replyFlexMessage, replyText } from "../services/lineService";
import { getAllStaff } from "../services/staffService";
import { bookQueue } from "../services/queueService";

export const handleWebhook = async (req: Request, res: Response) => {
  const events = req.body.events;

  for (const event of events) {
    // Safeguard to ensure there is a valid event
    if (!event || !event.type) continue;

    const replyToken = event.replyToken;

    // Handle "book_queue" trigger
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "book_queue"
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
                text: `book ${staff.name}`, // Send a custom message like "book Staff Name"
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
    }

    // Handle booking the queue after the user clicks the "Book" button
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text.startsWith("book ")
    ) {
      const staffName = event.message.text.replace("book ", ""); // Extract the staff name from the message
      const userId = event.source.userId; // Get the LINE user ID
      const staff = await getAllStaff(); // Get the list of all staff

      // Find the staff member by name
      const staffMember = staff.find((s) => s.name === staffName);

      if (!staffMember) {
        await replyText(
          userId,
          "Sorry, the staff member you selected doesn't exist."
        );
        return;
      }

      try {
        // Book the queue with the selected staff member
        const result = await bookQueue(userId, staffMember._id.toString()); // Pass staffId to the bookQueue function
        if (result) {
          // Respond with the queue number
          const message = `You have successfully booked the queue with ${staffName}. Your queue number is ${result.queueNumber}.`;
          await replyText(userId, message);
        } else {
          const message = "Sorry, we couldn't book your queue at the moment.";
          await replyText(userId, message);
        }
      } catch (error: unknown) {
        // Explicitly type 'error' as 'unknown'
        console.error("Queue Booking Error:", error);

        // Handle the 'unknown' error case
        if (error instanceof Error) {
          const errorMessage =
            error.message ||
            "There was an error processing your queue request.";
          await replyText(userId, errorMessage); // Send the error message to the user
        } else {
          const errorMessage = "An unknown error occurred.";
          await replyText(userId, errorMessage);
        }
      }
    }
  }

  res.sendStatus(200); // Acknowledge the webhook request
};
