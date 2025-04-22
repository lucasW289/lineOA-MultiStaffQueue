import { Router } from "express";
import { handleWebhook } from "../controllers/webhookController";

const router = Router();

// Define the POST route for the webhook
router.post("/", handleWebhook);

export default router;
