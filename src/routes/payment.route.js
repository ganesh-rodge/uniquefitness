import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getUserPayments,
  getAllPayments
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = Router();

// User
router.post("/create-order", verifyJWT, createOrder);
router.post("/verify", verifyJWT, verifyPayment);
router.get("/my", verifyJWT, getUserPayments);

// Admin
router.get("/", verifyJWT, verifyAdmin, getAllPayments);

export default router;
