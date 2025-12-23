// Public: Get all diet plans
const getAllDietPlans = asyncHandler(async (req, res) => {
    const diets = await DietPlan.find();
    return res.status(200).json(new ApiResponse(200, diets, "All diet plans fetched successfully"));
});
// Admin: Update a diet plan
const updateDietPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { purpose, timing, category, plan } = req.body;
    const updated = await DietPlan.findByIdAndUpdate(
        id,
        { purpose, timing, category, plan },
        { new: true, runValidators: true }
    );
    if (!updated) throw new ApiError(404, "Diet plan not found");
    return res.status(200).json(new ApiResponse(200, updated, "Diet plan updated successfully"));
});

// Admin: Delete a diet plan
const deleteDietPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await DietPlan.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Diet plan not found");
    return res.status(200).json(new ApiResponse(200, {}, "Diet plan deleted successfully"));
});
import { DietPlan } from "../models/dietplan.model.js";

// Admin: Create one or more diet plans (bulk supported)
const createDietPlan = asyncHandler(async (req, res) => {
    let input = req.body;
    let toInsert = [];

    // Accepts:
    // 1. Array of { purpose, category, plan }
    // 2. Single { purpose, category, plan }
    // 3. Array of { purpose, categories: [{ category, plan }] }
    // 4. Single { purpose, categories: [...] }

    if (!Array.isArray(input)) {
        input = [input];
    }

    input.forEach((item) => {
        if (item.categories && Array.isArray(item.categories)) {
            // Nested format: { purpose, categories: [{ category, plan }] }
            item.categories.forEach((cat) => {
                const { category, plan: planArr } = cat;
                if (!item.purpose || !category || !Array.isArray(planArr)) {
                    throw new ApiError(400, 'Each category must have purpose, category, and plan array');
                }
                toInsert.push({ purpose: item.purpose, category, plan: planArr });
            });
        } else {
            // Flat format: { purpose, category, plan }
            const { purpose, category, plan: planArr } = item;
            if (!purpose || !category || !Array.isArray(planArr)) {
                throw new ApiError(400, 'Each diet plan must have purpose, category, and plan array');
            }
            toInsert.push({ purpose, category, plan: planArr });
        }
    });

    const created = await DietPlan.insertMany(toInsert);
    res.status(201).json({ success: true, data: created });
});
import { MembershipPlan } from "../models/membershipplan.model.js";
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Activity } from "../models/activity.model.js";
import { buildMembershipWindow } from "../utils/membership.utils.js";

/** ---------------------------
 * Generate Access Token
 * --------------------------- */
const generateAdminAccessToken = (admin) => {
    return jwt.sign(
        { _id: admin._id, role: admin.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "2d" }
    );
};

/** ---------------------------
 * Admin Login
 * --------------------------- */
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(400, "Email and Password are required");

  const admin = await Admin.findOne({ email });
  if (!admin) throw new ApiError(401, "Invalid credentials!");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials!");

  const accessToken = generateAdminAccessToken(admin);

  // Set httpOnly cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true on HTTPS
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
  });

  // Send admin info + token for Postman testing
  return res.status(200).json(
    new ApiResponse(200, { admin, accessToken }, "Admin logged in successfully")
  );
});

/** ---------------------------
 * Get All Members with Sorting
 * --------------------------- */
const getAllMembers = asyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const members = await User.aggregate([
            {
                $addFields: {
                    membershipStatus: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $or: [
                                            {
                                                $not: [
                                                    { $ifNull: ["$membership.planId", false] }
                                                ]
                                            },
                                            { $eq: ["$membership.status", "inactive"] },
                                            {
                                                $and: [
                                                    { $ifNull: ["$membership.startDate", false] },
                                                    { $gt: ["$membership.startDate", now] }
                                                ]
                                            }
                                        ]
                                    },
                                    then: "inactive"
                                },
                                {
                                    case: {
                                        $and: [
                                            { $ifNull: ["$membership.endDate", false] },
                                            { $lt: ["$membership.endDate", now] }
                                        ]
                                    },
                                    then: "expired"
                                },
                                {
                                    case: {
                                        $and: [
                                            { $ifNull: ["$membership.endDate", false] },
                                            { $gte: ["$membership.endDate", now] },
                                            { $lte: ["$membership.endDate", sevenDaysLater] }
                                        ]
                                    },
                                    then: "expiring"
                                }
                            ],
                            default: "active"
                        }
                    }
                }
            },
            {
                $sort: {
                    membershipStatus: 1, // expired → expiring → active
                    "membership.endDate": 1
                }
            }
        ]);

        return res
            .status(200)
            .json(new ApiResponse(200, members, "Members fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch members");
    }
});

/** ---------------------------
 * Update Member (Admin Control)
 * --------------------------- */
const updateMemberByAdmin = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const updateData = req.body;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password -refreshToken");

        if (!updatedUser) throw new ApiError(404, "User not found");

        // Log activity
        const { logActivity } = await import("../utils/activityLogger.js");
        await logActivity({
            actor: req.user._id,
            action: "updated member",
            resourceType: "member",
            resourceId: userId,
            metadata: updateData
        });

        return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

/** ---------------------------
 * Delete Member
 * --------------------------- */
const deleteMemberByAdmin = asyncHandler(async (req, res) => {
        const { userId } = req.params;

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) throw new ApiError(404, "User not found");

        // Log activity
        const { logActivity } = await import("../utils/activityLogger.js");
        await logActivity({
            actor: req.user._id,
            action: "deleted member",
            resourceType: "member",
            resourceId: userId,
            metadata: deletedUser
        });

        return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

/** ---------------------------
 * Update Gym Info
 * --------------------------- */
const updateGymInfo = asyncHandler(async (req, res) => {
    const { name, gymLogoUrl } = req.body;

    const admin = await Admin.findByIdAndUpdate(
        req.user._id,
        { $set: { name, gymLogoUrl } },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, admin, "Gym info updated successfully"));
});

/** ---------------------------
 * Change Admin Password
 * --------------------------- */
const changeAdminPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user._id);
    if (!admin) throw new ApiError(404, "Admin not found");

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) throw new ApiError(401, "Old password is incorrect");

    admin.password = newPassword;
    await admin.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Forgot Password (token-driven flow placeholder)
const ADMIN_RESET_SECRET = "amitkanseunique2018";

const forgotPasswordAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const admin = await Admin.findOne({ email });
    if (!admin) throw new ApiError(404, "Admin not found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email validated. Provide the admin reset secret code to continue."));
});

// Reset Password (secret-code protected)
const resetPasswordAdmin = asyncHandler(async (req, res) => {
    const { email, newPassword, secretCode } = req.body;
    if (!email || !newPassword || !secretCode)
        throw new ApiError(400, "Email, new password, and admin reset secret code are required");

    if (secretCode !== ADMIN_RESET_SECRET) {
        throw new ApiError(401, "Invalid admin reset secret code");
    }

    const sanitizedEmail = email.toString().trim();
    const admin = await Admin.findOne({ email: sanitizedEmail }).collation({ locale: "en", strength: 2 });
    if (!admin) throw new ApiError(404, "Admin not found");

    admin.password = newPassword;
    await admin.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Admin password reset successfully"));
});

const getSingleMemberById = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await User.findById(memberId).populate("membership.planId");
    if (!member) throw new ApiError(404, "Member not found");

    return res.status(200).json(new ApiResponse(200, member, "Member fetched successfully"));
});

const assignMembershipPlan = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { planId, startDate: startDateInput } = req.body;

    if (!planId) throw new ApiError(400, "Plan ID is required");
    if (!startDateInput) throw new ApiError(400, "Membership start date is required");

    const plan = await MembershipPlan.findById(planId);
    if (!plan) throw new ApiError(404, "Membership plan not found");

    const { startDate, endDate, status } = buildMembershipWindow(startDateInput, plan.duration);

    const updatedMember = await User.findByIdAndUpdate(
        memberId,
        {
            membership: {
                planId,
                startDate,
                endDate,
                status
            }
        },
        { new: true, runValidators: true }
    ).populate("membership.planId");

    if (!updatedMember) throw new ApiError(404, "User not found");

    const { logActivity } = await import("../utils/activityLogger.js");
    await logActivity({
        actor: req.user._id,
        action: "assigned membership plan",
        resourceType: "member",
        resourceId: memberId,
        metadata: {
            planId,
            startDate,
            endDate,
            status
        }
    });

    return res.status(200).json(new ApiResponse(200, updatedMember, "Membership updated successfully"));
});

const updateAssignedMembershipPlan = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { planId: incomingPlanId, startDate: startDateInput } = req.body;

    const member = await User.findById(memberId);
    if (!member) throw new ApiError(404, "User not found");

    const currentMembership = member.membership || {};
    const planId = incomingPlanId || currentMembership.planId;
    if (!planId) throw new ApiError(400, "Plan ID is required");

    const plan = await MembershipPlan.findById(planId);
    if (!plan) throw new ApiError(404, "Membership plan not found");

    const effectiveStartDateInput = startDateInput || currentMembership.startDate;
    if (!effectiveStartDateInput) throw new ApiError(400, "Membership start date is required");

    const { startDate, endDate, status } = buildMembershipWindow(effectiveStartDateInput, plan.duration);

    const updatedMember = await User.findByIdAndUpdate(
        memberId,
        {
            membership: {
                planId,
                startDate,
                endDate,
                status
            }
        },
        { new: true, runValidators: true }
    ).populate("membership.planId");

    const { logActivity } = await import("../utils/activityLogger.js");
    await logActivity({
        actor: req.user._id,
        action: "updated membership plan",
        resourceType: "member",
        resourceId: memberId,
        metadata: {
            planId,
            startDate,
            endDate,
            status
        }
    });

    return res.status(200).json(new ApiResponse(200, updatedMember, "Membership updated successfully"));
});

const removeAssignedMembershipPlan = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await User.findById(memberId);
    if (!member) throw new ApiError(404, "User not found");

    const updatedMember = await User.findByIdAndUpdate(
        memberId,
        {
            membership: {
                planId: null,
                startDate: null,
                endDate: null,
                status: "inactive"
            }
        },
        { new: true, runValidators: true }
    ).populate("membership.planId");

    const { logActivity } = await import("../utils/activityLogger.js");
    await logActivity({
        actor: req.user._id,
        action: "removed membership plan",
        resourceType: "member",
        resourceId: memberId,
        metadata: {}
    });

    return res.status(200).json(new ApiResponse(200, updatedMember, "Membership removed successfully"));
});

const adminDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const totalMembers = await User.countDocuments();

    // Compute status on the fly to handle cases where membership.status is missing or outdated
    const grouped = await User.aggregate([
        {
            $addFields: {
                endDateParsed: {
                    $cond: [
                        { $ifNull: ["$membership.endDate", false] },
                        { $toDate: "$membership.endDate" },
                        null
                    ]
                },
                computedStatus: {
                    $cond: [
                        { $eq: ["$membership.status", "inactive"] },
                        "inactive",
                        {
                            $cond: [
                                {
                                    $and: [
                                        { $ifNull: ["$membership.endDate", false] },
                                        { $lt: ["$endDateParsed", now] }
                                    ]
                                },
                                "expired",
                                {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ifNull: ["$membership.endDate", false] },
                                                { $gte: ["$endDateParsed", now] },
                                                { $lte: ["$endDateParsed", soon] }
                                            ]
                                        },
                                        "expiring",
                                        // Default to active when endDate is in future or not provided but status isn't inactive/expired
                                        "active"
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        },
        { $group: { _id: "$computedStatus", count: { $sum: 1 } } }
    ]);

    const counts = grouped.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

    const activeMembers = counts["active"] || 0;
    const expiringSoon = counts["expiring"] || 0;
    // Per requirement, expiredMembers should include both 'expired' and 'inactive'
    const expiredMembers = (counts["expired"] || 0) + (counts["inactive"] || 0);

    return res.status(200).json(new ApiResponse(200, {
        totalMembers,
        activeMembers,
        expiringSoon,
        expiredMembers,
        // Optional breakdown for debugging/visibility
        breakdown: counts
    }, "Dashboard stats fetched successfully"));
});


const adminReports = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
        query["membership.startDate"] = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const report = await User.find(query).populate("membership.planId");

    return res.status(200).json(new ApiResponse(200, report, "Report fetched successfully"));
});

// Recent Activities (admin only)
const getRecentActivities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, resourceType, action } = req.query;
    const query = {};
    if (resourceType) query.resourceType = resourceType;
    if (action) query.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
        Activity.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('actor', 'name email'),
        Activity.countDocuments(query)
    ]);

    // Format as simple announcement-style entries
    const announcements = items.map((it) => {
        const actorName = it.actor?.name || 'Admin';
        const actionText = it.action?.replace('.', ' ');
        const resType = it.resourceType;
        const resId = it.resourceId ? ` (${it.resourceId})` : '';
        return {
            message: `${actorName} ${actionText} ${resType}${resId}`,
            at: it.createdAt,
            actor: { name: actorName, email: it.actor?.email }
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            page: Number(page),
            limit: Number(limit),
            total,
            items: announcements
        }, 'Recent activities fetched successfully')
    );
});


export {
    loginAdmin,
    getAllMembers,
    updateMemberByAdmin,
    deleteMemberByAdmin,
    updateGymInfo,
    changeAdminPassword,
    forgotPasswordAdmin,
    resetPasswordAdmin,
    getSingleMemberById,
    assignMembershipPlan,
    updateAssignedMembershipPlan,
    removeAssignedMembershipPlan,
    adminDashboardStats,
    adminReports,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan,
    getAllDietPlans,
    getRecentActivities
};
