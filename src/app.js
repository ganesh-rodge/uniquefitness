import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthcheckRouter from './routes/healthcheck.route.js';
import userRouter from './routes/user.route.js';
import adminRouter from "./routes/admin.route.js";
import announcementRouter from './routes/announcement.route.js';
import membershipRouter from "./routes/membership.route.js";
import dietplanRouter from "./routes/diet.route.js";
import workoutRouter from "./routes/workout.route.js";
import paymentRouter from "./routes/payment.route.js";

const app = express();

// Middleware
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// CORS setup
const allowedOrigins = process.env.CORS_ORIGIN.split(','); // Array of allowed origins
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Allow Postman, curl
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"]
}));

// Routes
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/announcement", announcementRouter);
app.use("/api/v1/membership", membershipRouter);
app.use("/api/v1/dietplan", dietplanRouter);
app.use("/api/v1/workout", workoutRouter);
app.use("/api/v1/payment", paymentRouter);

// Error handling for CORS
app.use((err, req, res, next) => {
  if (err instanceof Error && err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

export default app;
