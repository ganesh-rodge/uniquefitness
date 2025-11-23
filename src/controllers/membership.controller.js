import { MembershipPlan } from "../models/membershipplan.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const ALLOWED_BRANCHES = ["b1", "b2"];

const normalizeBranch = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : null;

// ---------------- CREATE PLAN (Admin only) ----------------
const createPlan = async (req, res, next) => {
    try {
        const { branch, ...planPayload } = req.body || {};
        const normalizedBranch = normalizeBranch(branch);

        if (!normalizedBranch || !ALLOWED_BRANCHES.includes(normalizedBranch)) {
            return res
                .status(400)
                .json(new ApiResponse(400, null, "Invalid branch. Allowed values are b1 or b2."));
        }

        const plan = await MembershipPlan.create({
            ...planPayload,
            branch: normalizedBranch,
            createdBy: req.user._id
        });
        res.status(201).json(new ApiResponse(201, plan, "Membership plan created"));
    } catch (error) {
        next(error);
    }
};

// ---------------- UPDATE PLAN (Admin only) ----------------
const updatePlan = async (req, res, next) => {
    try {
        if (Object.prototype.hasOwnProperty.call(req.body, "branch")) {
            const normalizedBranch = normalizeBranch(req.body.branch);
            if (!normalizedBranch || !ALLOWED_BRANCHES.includes(normalizedBranch)) {
                return res
                    .status(400)
                    .json(new ApiResponse(400, null, "Invalid branch. Allowed values are b1 or b2."));
            }
            req.body.branch = normalizedBranch;
        }

        const plan = await MembershipPlan.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!plan) {
            return res.status(404).json(new ApiResponse(404, null, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(200, plan, "Membership plan updated"));
    } catch (error) {
        next(error);
    }
};

// ---------------- DELETE PLAN (Admin only) ----------------
const deletePlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
        if (!plan) {
            return res.status(404).json(new ApiResponse(404, null, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(200, null, "Membership plan deleted"));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET ALL PLANS (Public) ----------------
const getAllPlans = async (req, res, next) => {
    try {
        const plans = await MembershipPlan.find().sort({ createdAt: -1 });
        res.status(200).json(new ApiResponse(200, plans, "Membership plans fetched"));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET SINGLE PLAN (Public) ----------------
const getPlan = async (req, res, next) => {
    try {
        const plan = await MembershipPlan.findById(req.params.id);
        if (!plan) {
            return res.status(404).json(new ApiResponse(404, null, "Plan not found"));
        }
        res.status(200).json(new ApiResponse(200, plan, "Membership plan fetched"));
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
