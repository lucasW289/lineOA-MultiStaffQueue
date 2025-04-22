import { Request, Response } from "express";
import { replyFlexMessage, replyText } from "../services/lineService";
import { getAllStaff } from "../services/staffService";
import {
  bookQueue,
  cancelQueue,
  getActiveQueuesForStaff,
  getQueueStatus,
} from "../services/queueService";

export const handleWebhook = async (req: Request, res: Response) => {
  const events = req.body.events;

  for (const event of events) {
    if (!event || !event.type) continue;

    const replyToken = event.replyToken;

    // Handle "Join a Queue"
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

    // Handle Booking
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
          await replyFlexMessage(replyToken, {
            type: "carousel",
            contents: [
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "🎉 Booking Confirmed!",
                      weight: "bold",
                      size: "lg",
                      color: "#1DB446",
                    },
                    {
                      type: "text",
                      text: `Staff: ${staffName}`,
                      margin: "md",
                    },
                    {
                      type: "text",
                      text: `Your Queue No: ${result.queueNumber}`,
                      margin: "sm",
                      weight: "bold",
                    },
                  ],
                },
              },
            ],
          });
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

    // Handle Cancel
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "Cancel My Queue"
    ) {
      const userId = event.source.userId;

      try {
        const cancelled = await cancelQueue(userId);

        if (cancelled) {
          await replyFlexMessage(replyToken, {
            type: "carousel",
            contents: [
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "🚫 Queue Cancelled",
                      weight: "bold",
                      size: "lg",
                      color: "#FF3B30",
                    },
                    {
                      type: "text",
                      text: "Your queue has been cancelled successfully.",
                      margin: "md",
                    },
                  ],
                },
              },
            ],
          });
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

    // Handle Queue Status
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "View My Queue"
    ) {
      const userId = event.source.userId;

      try {
        const status = await getQueueStatus(userId);

        if (!status) {
          await replyText(
            userId,
            "You don't have any active queues right now."
          );
        } else {
          await replyFlexMessage(replyToken, {
            type: "carousel",
            contents: [
              {
                type: "bubble",
                body: {
                  type: "box",
                  layout: "vertical",
                  contents: [
                    {
                      type: "text",
                      text: "📋 Your Queue Status",
                      weight: "bold",
                      size: "lg",
                      color: "#0066FF",
                    },
                    {
                      type: "text",
                      text: `Staff: ${status.staffName}`,
                      margin: "md",
                    },
                    {
                      type: "text",
                      text: `Your Queue No: ${status.yourPosition}`,
                      margin: "sm",
                    },
                    {
                      type: "text",
                      text: `People Ahead of You in Queue: ${status.peopleAhead}`,
                      margin: "sm",
                    },
                    {
                      type: "text",
                      text: status.currentQueueNumber
                        ? `Currently Serving: #${status.currentQueueNumber}`
                        : "There is currently no one in the meeting room with staff",
                      margin: "sm",
                      wrap: true,
                    },
                  ],
                },
              },
            ],
          });
        }
      } catch (error) {
        console.error("Queue Status Error:", error);
        await replyText(
          userId,
          "Something went wrong while fetching your queue status."
        );
      }
      continue;
    }

    //Rich Menu 3
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text === "Admin Access"
    ) {
      const userId = event.source.userId;
      console.log("I am here");
      await replyText(
        userId,
        "🔒 Please enter the admin passcode starting with &&:"
      );
      continue;
    }

    // Handle Admin Passcode
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text.startsWith("&&")
    ) {
      const userId = event.source.userId;
      const passcode = event.message.text.slice(2); // remove '&&'

      if (passcode === "Admin123") {
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
                text: `🧑‍💼 ${staff.name}`,
                weight: "bold",
                size: "lg",
                margin: "md",
              },
              {
                type: "text",
                text: `Role: ${staff.role}`,
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
                  label: "Manage Queue",
                  text: `Manage Queue for ${staff.name}`,
                },
              },
            ],
          },
        }));

        await replyText(
          userId,
          "✅ Welcome Admin! Please choose a staff to manage."
        );
        await replyFlexMessage(event.replyToken, {
          type: "carousel",
          contents: bubbles,
        });
      } else {
        await replyText(userId, "❌ Invalid passcode. Try again.");
      }

      continue;
    }
    //Admin Managing Queue
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.message.text.startsWith("Manage Queue for ")
    ) {
      const staffName = event.message.text.replace("Manage Queue for ", "");
      const userId = event.source.userId;

      const staffList = await getAllStaff();
      const staff = staffList.find((s) => s.name === staffName);

      if (!staff) {
        await replyText(userId, "❌ Staff not found.");
        continue;
      }

      // ✅ Add this line
      await replyText(userId, `🛠 Managing Queue for ${staff.name}`);
      const queues = await getActiveQueuesForStaff(staff._id.toString());

      if (queues.length === 0) {
        await replyText(userId, `📭 No active queues for ${staff.name}.`);
        continue;
      }

      const bubbles = queues.map((queue, index) => ({
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `#${queue.queueNumber}`, // Use queueNumber from the service
              weight: "bold",
              size: "xl",
              margin: "md",
              color: "#1DB446",
            },
            {
              type: "text",
              text: `User ID: ${queue.userId}`, // Display the user ID
              size: "sm",
              margin: "md",
              wrap: true,
            },
            {
              type: "text",
              text: `Status: ${queue.status}`, // Display the status
              size: "sm",
              margin: "md",
              color: "#888888",
            },
          ],
        },
        footer:
          index === 0
            ? {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "button",
                    style: "primary",
                    height: "sm",
                    action: {
                      type: "message",
                      label: "In Progress",
                      text: `admin in-progress ${queue._id}`,
                    },
                  },
                  {
                    type: "button",
                    style: "secondary",
                    height: "sm",
                    action: {
                      type: "message",
                      label: "Served",
                      text: `admin served ${queue._id}`,
                    },
                  },
                ],
              }
            : undefined,
      }));

      await replyFlexMessage(event.replyToken, {
        type: "carousel",
        contents: bubbles,
      });

      continue;
    }
  }

  res.sendStatus(200);
};
