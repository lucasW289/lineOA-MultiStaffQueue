import axios from "axios";

// PUSH: used when you know the user's LINE ID (userId)
export const replyText = async (userId: string, text: string) => {
  const message = {
    to: userId,
    messages: [
      {
        type: "text",
        text: text,
      },
    ],
  };

  await axios.post("https://api.line.me/v2/bot/message/push", message, {
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
};

// REPLY: used when replying to a webhook event (via replyToken)
export const replyFlexMessage = async (
  replyToken: string,
  flexContent: any
) => {
  const message = {
    replyToken,
    messages: [
      {
        type: "flex",
        altText: "Staff list",
        contents: flexContent,
      },
    ],
  };

  await axios.post("https://api.line.me/v2/bot/message/reply", message, {
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
};
