
import express from "express";
import { createOrUpdateSchedule, getUserSchedule } from "../controllers/workout.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideo } from "../controllers/AddVideo.js";
import { deleteVideo } from "../controllers/DeleteVideo.js";
import { updateVideo } from "../controllers/UpdateVideo.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";
import { getVideos } from "../controllers/GetVideos.js";

const router = express.Router();

router.use(verifyJWT);

// Create or update user workout schedule
router.patch("/", createOrUpdateSchedule);

// Get user schedule
router.get("/", getUserSchedule);


// Add video(s) to muscle group (admin only)
router.post("/video", verifyAdmin, addVideo);

// Delete video from muscle group (admin only)
router.delete("/video", verifyAdmin, deleteVideo);

// Update video for muscle group (admin only)
router.put("/video", verifyAdmin, updateVideo);

// Get video links for a muscle group (public)
router.get("/video", getVideos);

export default router;
