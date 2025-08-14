import { DietPlan } from "../models/dietplan.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE DIET PLAN ----------------
const createDietPlan = async (req, res, next) => {
    try {
        const { title, description, calories } = req.body;

        const dietPlan = await DietPlan.create({
            title,
            description,
            calories,
            createdBy: req.user._id,
            creatorModel: req.user.role === "admin" ? "Admin" : "User",
            isDefault: req.user.role === "admin" ? true : false
        });

        res.status(201).json(new ApiResponse(true, "Diet plan created", dietPlan));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET DIET PLANS ----------------
const getDietPlans = async (req, res, next) => {
    try {
        let plans;
        if (req.user.role === "admin") {
            // Admin can see all plans
            plans = await DietPlan.find().sort({ createdAt: -1 });
        } else {
            // User: default plans + user's own plans
            plans = await DietPlan.find({
                $or: [
                    { isDefault: true },
                    { createdBy: req.user._id }
                ]
            }).sort({ createdAt: -1 });
        }

        res.status(200).json(new ApiResponse(true, "Diet plans fetched", plans));
    } catch (error) {
        next(error);
    }
};

// ---------------- UPDATE DIET PLAN ----------------
const updateDietPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dietPlan = await DietPlan.findById(id);

        if (!dietPlan) {
            return res.status(404).json(new ApiResponse(false, "Diet plan not found"));
        }

        // Only creator or admin can update
        if (!dietPlan.createdBy.equals(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json(new ApiResponse(false, "Access denied"));
        }

        Object.assign(dietPlan, req.body);
        await dietPlan.save();

        res.status(200).json(new ApiResponse(true, "Diet plan updated", dietPlan));
    } catch (error) {
        next(error);
    }
};

// ---------------- DELETE DIET PLAN ----------------
const deleteDietPlan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const dietPlan = await DietPlan.findById(id);

        if (!dietPlan) {
            return res.status(404).json(new ApiResponse(false, "Diet plan not found"));
        }

        // Only creator or admin can delete
        if (!dietPlan.createdBy.equals(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json(new ApiResponse(false, "Access denied"));
        }

        await dietPlan.deleteOne();
        res.status(200).json(new ApiResponse(true, "Diet plan deleted"));
    } catch (error) {
        next(error);
    }
};

export{
    createDietPlan,
    getDietPlans,
    updateDietPlan,
    deleteDietPlan
}