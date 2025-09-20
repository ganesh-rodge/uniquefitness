import express from "express";
import { createOrUpdateSchedule, getUserSchedule } from "../controllers/workout.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// Create or update user workout schedule
router.patch("/", createOrUpdateSchedule);

// Get user schedule
router.get("/", getUserSchedule);

export default router;
