import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "INR"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },
    orderId: {
      type: String, // Razorpay order ID
      unique: true
    },
    transactionId: {
      type: String // Razorpay payment ID
    },
    receipt: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
