import { MembershipPlan } from "../models/membershipplan.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE PLAN (Admin only) ----------------
const createPlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json(new ApiResponse(true, "Membership plan created", plan));
    } catch (error) {
        next(error);
    }
};

// ---------------- UPDATE PLAN (Admin only) ----------------
const updatePlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!plan) {
            return res.status(404).json(new ApiResponse(false, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(true, "Membership plan updated", plan));
    } catch (error) {
        next(error);
    }
};

// ---------------- DELETE PLAN (Admin only) ----------------
const deletePlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
        if (!plan) {
            return res.status(404).json(new ApiResponse(false, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(true, "Membership plan deleted"));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET ALL PLANS (Public) ----------------
const getAllPlans = async (req, res, next) => {
    try {
        const plans = await MembershipPlan.find().sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(true, "Membership plans fetched", plans));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET SINGLE PLAN (Public) ----------------
const getPlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json(new ApiResponse(false, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(true, "Membership plan fetched", plan));
    } catch (error) {
        next(error);
    }
};

export {
    createPlan,
    updatePlan,
    deletePlan,
    getAllPlans,
    getPlan
}
