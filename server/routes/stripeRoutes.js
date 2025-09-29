// routes/stripeRoutes.js
import express from "express";
import { handleStripeWebhook } from "../services/stripeService.js";

const router = express.Router();

// Middleware especial para raw body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
