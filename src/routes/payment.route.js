import express from "express";
import {
  createOrder,
  verifyPayment,
  getUserPayments,
  getAllPayments
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = express.Router();

// Ensure all controllers exist
if (!createOrder || !verifyPayment || !getUserPayments || !getAllPayments) {
  throw new Error("One or more payment controller functions are missing or undefined");
}

// User routes
router.post("/create-order", verifyJWT, createOrder);
router.post("/verify", verifyJWT, verifyPayment);
router.get("/my", verifyJWT, getUserPayments);

// Admin route
router.get("/", verifyJWT, verifyAdmin, getAllPayments);

export default router;
