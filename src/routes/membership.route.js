import express from "express";
import { 
    createPlan, 
    updatePlan, 
    deletePlan, 
    getAllPlans, 
    getPlan 
} from "../controllers/membership.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";

const router = express.Router();

// ---------------- PUBLIC ROUTES ----------------
router.get("/", getAllPlans);
router.get("/:id", getPlan);

// ---------------- ADMIN-ONLY ROUTES ----------------
router.post("/", verifyJWT, verifyAdmin, createPlan);
router.patch("/:id", verifyJWT, verifyAdmin, updatePlan);
router.delete("/:id", verifyJWT, verifyAdmin, deletePlan);

export default router;
