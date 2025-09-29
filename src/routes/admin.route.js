// Public: Get all diet plans (no auth)
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/verifyAdmin.middleware.js";
import {
    loginAdmin,
    getAllMembers,
    updateMemberByAdmin,
    deleteMemberByAdmin,
    changeAdminPassword,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    getSingleMemberById,
    updateMemberMembership,
    adminDashboardStats,
    adminReports,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan,
    getAllDietPlans
} from "../controllers/admin.controller.js";


const router = express.Router();

// Auth
router.post("/login", loginAdmin);

// Diet Plan Management
router.post("/dietplan", verifyJWT, verifyAdmin, createDietPlan);
router.put("/dietplan/:id", verifyJWT, verifyAdmin, updateDietPlan);
router.delete("/dietplan/:id", verifyJWT, verifyAdmin, deleteDietPlan);
router.get("/dietplans", getAllDietPlans);

// Member Management
router.get("/members", verifyJWT, verifyAdmin, getAllMembers);
router.patch("/members/:userId", verifyJWT, verifyAdmin, updateMemberByAdmin);
router.delete("/members/:userId", verifyJWT, verifyAdmin, deleteMemberByAdmin);

// Admin Account Management
router.patch("/change-password", verifyJWT, verifyAdmin, changeAdminPassword);

router.post("/forgot-password", forgotPasswordAdmin);
router.post("/reset-password", resetPasswordAdmin);

router.get("/member/:memberId", verifyJWT, getSingleMemberById);
router.patch("/member/:memberId/membership", verifyJWT, updateMemberMembership);
router.get("/dashboard-stats", verifyJWT, adminDashboardStats);
router.get("/reports", verifyJWT, adminReports); // Optional



export default router;
