import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { MembershipPlan } from "../models/membershipPlan.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * @desc    Create Razorpay order
 * @route   POST /api/v1/payment/create-order
 */
const createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const userId = req.user._id;

  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new ApiError(404, "Membership Plan not found");

  const options = {
    amount: plan.price * 100, // convert to paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);

  // Save in DB
  const payment = await Payment.create({
    userId,
    planId,
    amount: plan.price,
    currency: "INR",
    orderId: order.id,
    receipt: options.receipt,
    paymentStatus: "pending"
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { order, payment }, "Order created successfully"));
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/v1/payment/verify
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      paymentStatus: "success",
      transactionId: paymentId
    },
    { new: true }
  );

  if (!payment) throw new ApiError(404, "Payment not found");

  return res
    .status(200)
    .json(new ApiResponse(200, payment, "Payment verified successfully"));
});

/**
 * @desc    Get logged-in user's payment history
 * @route   GET /api/v1/payment/my
 */
const getUserPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id })
    .populate("planId", "name durationMonths price")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, payments, "User payments fetched successfully"));
});

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/v1/payment
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("userId", "fullname email")
    .populate("planId", "name durationMonths price")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, payments, "All payments fetched successfully"));
});


export{
    createOrder,
    verifyPayment,
    getAllPayments,
    getUserPayments
}