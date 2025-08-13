import express from "express";
import { 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement, 
    getAllAnnouncements, 
    getAnnouncement 
} from "../controllers/announcement.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Auth middleware
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = express.Router();

// ----------------- PUBLIC ROUTES -----------------
router.get("/", getAllAnnouncements);        // Anyone can view all announcements
router.get("/:id", getAnnouncement);        // Anyone can view a single announcement

// ----------------- ADMIN-ONLY ROUTES -----------------
// verifyJWT must run before verifyAdmin
router.post("/", verifyJWT, verifyAdmin, createAnnouncement);
router.patch("/:id", verifyJWT, verifyAdmin, updateAnnouncement);
router.delete("/:id", verifyJWT, verifyAdmin, deleteAnnouncement);

export default router;
