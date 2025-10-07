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
import { Admin } from "../models/admin.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/mail.js";

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
                                    case: { $lt: ["$membership.endDate", now] },
                                    then: "expired"
                                },
                                {
                                    case: {
                                        $and: [
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

    return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

/** ---------------------------
 * Delete Member
 * --------------------------- */
const deleteMemberByAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) throw new ApiError(404, "User not found");

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

// Forgot Password (Send OTP)
const forgotPasswordAdmin = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const admin = await Admin.findOne({ email });
    if (!admin) throw new ApiError(404, "Admin not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.emailOTP = otp;
    admin.OTPExpiry = Date.now() + 10 * 60 * 1000; // 10 min expiry
    await admin.save();

    // Send OTP using Resend
    const subject = "Your Unique Fitness OTP";
    const html = `<h2>Your OTP is ${otp}</h2><p>Expires in 10 minutes.</p>`;
    await sendEmail(email, subject, html);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "OTP sent to admin email for password reset"));
});

// Reset Password (Using OTP)
const resetPasswordAdmin = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
        throw new ApiError(400, "Email, OTP and new password are required");

    const admin = await Admin.findOne({ email });
    if (!admin) throw new ApiError(404, "Admin not found");

    if (admin.emailOTP !== otp || admin.OTPExpiry < Date.now()) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    admin.password = newPassword;
    admin.emailOTP = undefined;
    admin.OTPExpiry = undefined;
    await admin.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Admin password reset successful"));
});

const getSingleMemberById = asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    const member = await User.findById(memberId).populate("membership.planId");
    if (!member) throw new ApiError(404, "Member not found");

    return res.status(200).json(new ApiResponse(200, member, "Member fetched successfully"));
});

const updateMemberMembership = asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const { planId } = req.body;

    const plan = await MembershipPlan.findById(planId);
    if (!plan) throw new ApiError(404, "Membership plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const updatedMember = await User.findByIdAndUpdate(
        memberId,
        {
            membership: {
                planId,
                startDate,
                endDate,
                status: 'active'
            }
        },
        { new: true }
    ).populate("membership.planId");

    return res.status(200).json(new ApiResponse(200, updatedMember, "Membership updated successfully"));
});

const adminDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const totalMembers = await User.countDocuments();
    const activeMembers = await User.countDocuments({ "membership.status": "active" });
    const expiringSoon = await User.countDocuments({
        "membership.status": "active",
        "membership.endDate": { $lte: soon, $gte: now }
    });
    const expiredMembers = await User.countDocuments({ "membership.status": "expired" });

    return res.status(200).json(new ApiResponse(200, {
        totalMembers,
        activeMembers,
        expiringSoon,
        expiredMembers
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
    updateMemberMembership,
    adminDashboardStats,
    adminReports,
    createDietPlan,
    updateDietPlan,
    deleteDietPlan,
    getAllDietPlans
};
