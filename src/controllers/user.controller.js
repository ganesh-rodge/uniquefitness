import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { MembershipPlan } from "../models/membershipplan.model.js";

// Admin-only: Create a new user (no OTP, no signup token)
const ALLOWED_BRANCHES_FOR_MEMBERS = ["b1", "b2"];
const BRANCH_ALIAS_MAP = {
    b1: "b1",
    b2: "b2",
    b14c: "b1",
    b25v: "b2"
};

const ALLOWED_PURPOSES = ["gain", "loose", "maintain"];

const resolveBranch = (branchValue) => {
    if (!branchValue) return null;
    const normalizedInput = branchValue.toString().trim().toLowerCase();
    const normalizedBranch = BRANCH_ALIAS_MAP[normalizedInput];
    return ALLOWED_BRANCHES_FOR_MEMBERS.includes(normalizedBranch) ? normalizedBranch : null;
};

const resolvePurpose = (purposeValue) => {
    if (!purposeValue) return null;
    const normalizedPurpose = purposeValue.toString().trim().toLowerCase();
    return ALLOWED_PURPOSES.includes(normalizedPurpose) ? normalizedPurpose : null;
};

const adminCreateUser = asyncHandler(async (req, res) => {
    // Only allow if req.user is admin (enforce in route)
    const requiredFields = ["fullName", "username", "email", "password", "phone", "height", "weight", "purpose", "gender", "dob", "address", "branch"];
    for (const field of requiredFields) {
        if (!req.body[field]) throw new ApiError(400, `${field} is required`);
    }

    const { fullName, username, email, password, phone, height, weight, purpose, gender, dob, address } = req.body;
    const normalizedBranch = resolveBranch(req.body.branch);

    const sanitizedUsername = username?.toString().trim();
    if (!sanitizedUsername) {
        throw new ApiError(400, "Username is required");
    }

    const normalizedPurpose = resolvePurpose(purpose);
    if (!normalizedPurpose) {
        throw new ApiError(400, "Invalid purpose. Allowed values are gain, loose, maintain");
    }

    if (!normalizedBranch) {
        throw new ApiError(400, "Invalid branch. Allowed values are b1 or b2");
    }

    // Check for duplicate email
    const userExists = await User.findOne({
        $or: [{ email }, { username: sanitizedUsername }]
    });
    if (userExists) throw new ApiError(409, "User already exists with this email or username");

    const aadhaarBuffer = req.files?.aadhaarPhoto?.[0]?.buffer;
    const livePhotoBuffer = req.files?.livePhoto?.[0]?.buffer;
    if (!aadhaarBuffer || !livePhotoBuffer) {
        throw new ApiError(400, "Both Aadhaar and Live photos are required");
    }

    const aadhaarUpload = await uploadOnCloudinary(aadhaarBuffer);
    const livePhotoUpload = await uploadOnCloudinary(livePhotoBuffer);

    // Define workout splits
    const workoutSplits = [
        {
            Monday: ["Legs"],
            Tuesday: ["Back"],
            Wednesday: ["Chest"],
            Thursday: ["Biceps"],
            Friday: ["Shoulders"],
            Saturday: ["Triceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Back"],
            Tuesday: ["Shoulders"],
            Wednesday: ["Triceps"],
            Thursday: ["Chest"],
            Friday: ["Legs"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Shoulders"],
            Tuesday: ["Chest"],
            Wednesday: ["Legs"],
            Thursday: ["Triceps"],
            Friday: ["Back"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Chest"],
            Tuesday: ["Legs"],
            Wednesday: ["Shoulders"],
            Thursday: ["Back"],
            Friday: ["Triceps"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Biceps"],
            Tuesday: ["Chest"],
            Wednesday: ["Triceps"],
            Thursday: ["Legs"],
            Friday: ["Back"],
            Saturday: ["Shoulders"],
            Sunday: ["Rest"]
        }
    ];

    // Pick a random split and standardize keys to lowercase
    const randomSplit = workoutSplits[Math.floor(Math.random() * workoutSplits.length)];
    const lowerCaseSplit = Object.fromEntries(
      Object.entries(randomSplit).map(([day, val]) => [day.toLowerCase(), val])
    );

    let user = await User.create({
        fullName,
        username: sanitizedUsername,
        email,
        phone,
        password,
        branch: normalizedBranch,
        isEmailVerified: true,
        purpose: normalizedPurpose,
        height,
        weight,
        gender,
        dob,
        address,
        aadhaarPhotoUrl: aadhaarUpload.url,
        livePhotoUrl: livePhotoUpload.url,
        customWorkoutSchedule: lowerCaseSplit
    });

    // Log activity for admin-created member
    const { logActivity } = await import("../utils/activityLogger.js");
    await logActivity({
      actor: req.user._id, // Admin's id
      action: "admin created member",
      resourceType: "member",
      resourceId: user._id,
            metadata: { fullName, username: sanitizedUsername, email, phone, purpose: normalizedPurpose }
    });

    return res.status(201).json(
        new ApiResponse(201, {
            user: {
                ...user.toObject(),
                password: undefined,
                refreshToken: undefined
            }
        }, "User created successfully by admin")
    );
});

//Generating the tokens
const generateAccessAndRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)

        if(!user)
            throw new ApiError(404, "User not found")

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}



// Registering the user (branch derived from URL/query/body)
const registerUser = asyncHandler(async (req, res) => {
    const {
        email,
        fullName,
        username,
        password,
        phone,
        height,
        weight,
        purpose,
        gender,
        dob,
        address,
    } = req.body;

    if (!email) throw new ApiError(400, "Email is required");

    const sanitizedUsername = username?.toString().trim();
    if (!sanitizedUsername) throw new ApiError(400, "Username is required");

    const normalizedPurpose = resolvePurpose(purpose);
    if (!normalizedPurpose) throw new ApiError(400, "Invalid purpose. Allowed values are gain, loose, maintain");

    const existingUser = await User.findOne({
        $or: [{ email }, { username: sanitizedUsername }]
    });
    if (existingUser) throw new ApiError(409, "User already exists with this email or username");

    const branchCandidate = req.query.branch || req.body.branch || req.body.branchCode;
    const normalizedBranch = resolveBranch(branchCandidate);
    if (!normalizedBranch) {
        throw new ApiError(400, "Invalid branch. Allowed values are b1 or b2");
    }

    const requiredFields = ["fullName", "username", "purpose", "password", "phone", "height", "weight", "gender", "dob", "address"];
    for (const field of requiredFields) {
        if (!req.body[field]) throw new ApiError(400, `${field} is required`);
    }

    const aadhaarBuffer = req.files?.aadhaarPhoto?.[0]?.buffer;
    const livePhotoBuffer = req.files?.livePhoto?.[0]?.buffer;
    if (!aadhaarBuffer || !livePhotoBuffer) {
        throw new ApiError(400, "Both Aadhaar and Live photos are required");
    }

    const aadhaarUpload = await uploadOnCloudinary(aadhaarBuffer);
    const livePhotoUpload = await uploadOnCloudinary(livePhotoBuffer);

    // Define workout splits
    const workoutSplits = [
        {
            Monday: ["Legs"],
            Tuesday: ["Back"],
            Wednesday: ["Chest"],
            Thursday: ["Biceps"],
            Friday: ["Shoulders"],
            Saturday: ["Triceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Back"],
            Tuesday: ["Shoulders"],
            Wednesday: ["Triceps"],
            Thursday: ["Chest"],
            Friday: ["Legs"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Shoulders"],
            Tuesday: ["Chest"],
            Wednesday: ["Legs"],
            Thursday: ["Triceps"],
            Friday: ["Back"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Chest"],
            Tuesday: ["Legs"],
            Wednesday: ["Shoulders"],
            Thursday: ["Back"],
            Friday: ["Triceps"],
            Saturday: ["Biceps"],
            Sunday: ["Rest"]
        },
        {
            Monday: ["Biceps"],
            Tuesday: ["Chest"],
            Wednesday: ["Triceps"],
            Thursday: ["Legs"],
            Friday: ["Back"],
            Saturday: ["Shoulders"],
            Sunday: ["Rest"]
        }
    ];

    // Pick a random split and standardize keys to lowercase
    const randomSplit = workoutSplits[Math.floor(Math.random() * workoutSplits.length)];
    const lowerCaseSplit = Object.fromEntries(
        Object.entries(randomSplit).map(([day, val]) => [day.toLowerCase(), val])
    );

    const user = await User.create({
        fullName,
        username: sanitizedUsername,
        email,
        phone,
        password,
        branch: normalizedBranch,
        isEmailVerified: true,
        purpose: normalizedPurpose,
        height,
        weight,
        gender,
        dob,
        address,
        aadhaarPhotoUrl: aadhaarUpload.url,
        livePhotoUrl: livePhotoUpload.url,
        customWorkoutSchedule: lowerCaseSplit
    });

    // Log activity for new member creation
    const { logActivity } = await import("../utils/activityLogger.js");
    await logActivity({
        actor: user._id,
        action: "created member",
        resourceType: "member",
        resourceId: user._id,
        metadata: { fullName, username: sanitizedUsername, email, phone, purpose: normalizedPurpose, branch: normalizedBranch }
    });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res.status(201).json(
        new ApiResponse(201, {
            user: {
                ...user.toObject(),
                password: undefined,
                refreshToken: undefined
            },
            accessToken,
            refreshToken
        }, "User registered successfully")
    );
});

const loginUser = asyncHandler(async (req, res)=>{
    const { email, username, password } = req.body;

    if(!password) throw new ApiError(400, "Password is required!");
    if(!email && !username) throw new ApiError(400, "Email or username is required!");

    const normalizedEmail = email?.toString().trim();
    const normalizedUsername = username?.toString().trim();

    const user = await User.findOne({
        $or: [
            normalizedEmail ? { email: normalizedEmail } : null,
            normalizedUsername ? { username: normalizedUsername } : null
        ].filter(Boolean)
    }).collation({ locale: "en", strength: 2 });

    if(!user) throw new ApiError(404, "User not found !");

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(400, "Invalid credentials !")

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax"
     }

     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(new ApiResponse(
        200,
        {user: loggedInUser, accessToken, refreshToken},
        "Login Successful"
     ))
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {new: true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV = "production"
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User Logged Out SuccessFully"))
})

const updateLivePhoto = asyncHandler(async (req, res) => {
  const livePhotoBuffer = req.file?.buffer;
  if (!livePhotoBuffer) throw new ApiError(400, "Live photo file is missing");

  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User not found");

  // ✅ Delete old photo from Cloudinary if exists
  if (user.livePhotoUrl) {
    try {
      const urlParts = user.livePhotoUrl.split("/");
      const publicIdWithExtension = urlParts.slice(urlParts.indexOf("upload") + 1).join("/"); 
      const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, ""); // remove extension
      await deleteFromCloudinary(publicId);
    } catch (err) {
      console.error("⚠️ Failed to delete old photo from Cloudinary:", err.message);
    }
  }

  // ✅ Upload new photo
  const livePhotoUpload = await uploadOnCloudinary(livePhotoBuffer);
  if (!livePhotoUpload?.url) throw new ApiError(500, "Failed to upload live photo");

  user.livePhotoUrl = livePhotoUpload.url;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, user.toObject(), "Live Photo updated successfully!")
  );
});


const getCurrentUser = asyncHandler(async (req, res) => {
  // Fetch user from DB using id from req.user (set in middleware)
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  console.log(user)
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User information fetched successfully"));
});


const refreshAccessToken = asyncHandler(async (req, res)=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    console.log(incomingRefreshToken)
    if(!incomingRefreshToken)
        throw new ApiError(401, "Refresh Token is required!")
    
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const userId = decodedToken?._id

        if(!userId)
            throw new ApiError(402, "Invalid Refresh Token !")

        const user = await User.findById(userId)

        if(!user || user.refreshToken !== incomingRefreshToken){
            throw new ApiError("Invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Lax"
        }

        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refeshToken: newRefreshToken},
                "Access Token Refreshed Successfully"
            )
        )


    } catch (error) {
        throw new ApiError(500, error?.message, "Something went wrong !")
    }
})

const changeCurrentPassword = asyncHandler ( async (req, res)=>{
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword) throw new ApiError(400, "Enter old and new password")

    const user = await User.findById(req.user?._id)

    if(!user) throw new ApiError(404, "User not exists !")

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid) throw new ApiError(401, "Old Password is incorrect !")

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully !"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { height, weight, address } = req.body;

    // Build update object dynamically
    const updateFields = {};
    if (height) updateFields.height = height;
    if (weight) updateFields.weight = weight;
    if (address) updateFields.address = address;

    if (Object.keys(updateFields).length === 0) {
      throw new ApiError(400, "At least one valid field must be provided to update!");
    }

    // Find the user first
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    // If weight is updated, push to weightHistory
    if (weight && !isNaN(weight)) {
      user.weightHistory.push({ date: new Date(), weight });
    }

    // Update other fields
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (address) user.address = address;

    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User Account Updated Successfully!"));
  } catch (error) {
    console.error("ERROR IN updateAccountDetails:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



const updateWeight = asyncHandler(async (req, res) => {
    const { weight } = req.body;

    if (!weight || isNaN(weight)) {
        throw new ApiError(400, "Please provide a valid weight");
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update the latest weight
    user.weight = weight;

    // Append to history
    user.weightHistory.push({
        date: new Date(),
        weight: weight
    });

    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                currentWeight: user.weight,
                weightHistory: user.weightHistory
            },
            "Weight updated successfully"
        )
    );
});


const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Email validated. Provide the reset secret code to authorize the reset."));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, secretCode } = req.body;

    if (!email || !newPassword || !secretCode) {
        throw new ApiError(400, "Email, new password, and reset secret code are required");
    }

    const sanitizedEmail = email.toString().trim();

    if (secretCode !== "amitkanse22") {
        throw new ApiError(401, "Invalid reset secret code");
    }

    const user = await User.findOne({ email: sanitizedEmail })
        .collation({ locale: "en", strength: 2 });
    if (!user) throw new ApiError(404, "User not found");

    user.password = newPassword;
    user.markModified("password");
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const getWeightHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("weightHistory");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user.weightHistory, "Weight history fetched successfully"));
});

const linkMembershipToUser = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const userId = req.user._id;

    const plan = await MembershipPlan.findById(planId);
    if (!plan) throw new ApiError(404, "Membership plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const updatedUser = await User.findByIdAndUpdate(
        userId,
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

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Membership linked successfully"));
});


export {
    generateAccessAndRefreshToken,
    registerUser,
    adminCreateUser,
    loginUser,
    logoutUser,
    updateLivePhoto,
    getCurrentUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateWeight,
    forgotPassword,
    resetPassword,
    getWeightHistory,
    linkMembershipToUser
}