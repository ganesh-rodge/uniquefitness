import express from "express";
import { 
    createDietPlan, 
    getDietPlans, 
    updateDietPlan, 
    deleteDietPlan 
} from "../controllers/dietplan.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ---------------- PUBLIC/PROTECTED ROUTES ----------------
// All routes require authentication
router.use(verifyJWT);

// Create a diet plan (admin or user)
router.post("/", createDietPlan);

// Get diet plans (admin sees all, user sees default + own)
router.get("/", getDietPlans);

// Update diet plan (only creator or admin)
router.patch("/:id", updateDietPlan);

// Delete diet plan (only creator or admin)
router.delete("/:id", deleteDietPlan);

export default router;
