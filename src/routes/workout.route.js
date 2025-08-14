import express from "express";
import { createOrUpdateSchedule, getUserSchedule } from "../controllers/workout.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes are protected
router.use(verifyJWT);

// Create or update user workout schedule
router.post("/", createOrUpdateSchedule);

// Get user schedule
router.get("/", getUserSchedule);

export default router;
