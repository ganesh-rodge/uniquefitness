import crypto from "crypto";

const orderId = "order_RAG1lcFMJdAXmf";  // from create-order response
const paymentId = "pay_test123456";      // any fake payment id
const secret = "XwNZ5aNEQpSuxFAxtqftr208";  // copy from your .env

const signature = crypto
  .createHmac("sha256", secret)
  .update(orderId + "|" + paymentId)
  .digest("hex");

console.log("Generated Signature:", signature);
