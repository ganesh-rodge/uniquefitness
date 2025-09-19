import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import {generateOtp, sendEmailOtp} from "../utils/otpService.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

let otpStore = {}

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


//Step 1: Send OTP
const sendOTP = asyncHandler(async(req, res)=>{
    const {email} = req.body;

    if(!email) throw new ApiError(400, "Email is required")

    const userExists = await User.findOne({email});

    if(userExists) throw new ApiError(409, "User already exists")
    
    const otp = generateOtp()
    otpStore[email] = {otp, expiresAt: Date.now() + 10 * 60 * 1000};

    await sendEmailOtp(email, otp)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successFully"))
})

//Step 2: verify otp
const verifyOTP = asyncHandler(async (req, res)=>{
    const {email, otp} = req.body

    if(!email || !otp) throw new ApiError(400, "Email and OTP are required !")

     const storedOtpData = otpStore[email];
    if (!storedOtpData) throw new ApiError(400, "No OTP found for this email");
    if (storedOtpData.otp !== otp) throw new ApiError(400, "Invalid OTP");
    if (Date.now() > storedOtpData.expiresAt) throw new ApiError(400, "OTP expired");

    delete otpStore[email];

    const signupToken = jwt.sign({ email }, process.env.SIGNUP_TOKEN_SECRET, { expiresIn: "30m" });

    return res.status(200).json(new ApiResponse(200, { signupToken }, "OTP verified successfully"));
})

//step 3: registering the user
const registerUser = asyncHandler(async (req, res) => {
    const { signupToken } = req.body;

    let decoded;
    try {
        decoded = jwt.verify(signupToken, process.env.SIGNUP_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired signup token");
    }

    const email = decoded.email;

    const requiredFields = ["fullName", "password", "phone", "height", "weight", "gender", "dob", "address"];
    for (const field of requiredFields) {
        if (!req.body[field]) throw new ApiError(400, `${field} is required`);
    }

    const { fullName, password, phone, height, weight, gender, dob, address } = req.body;


    const aadhaarBuffer = req.files?.aadhaarPhoto?.[0]?.buffer;
    const livePhotoBuffer = req.files?.livePhoto?.[0]?.buffer;
    if (!aadhaarBuffer || !livePhotoBuffer) {
        throw new ApiError(400, "Both Aadhaar and Live photos are required");
    }

    const aadhaarUpload = await uploadOnCloudinary(aadhaarBuffer);
    const livePhotoUpload = await uploadOnCloudinary(livePhotoBuffer);

    const user = await User.create({
        fullName,
        email,
        phone,
        password,
        isEmailVerified: true,
        height,
        weight,
        gender,
        dob,
        address,
        aadhaarPhotoUrl: aadhaarUpload.url,
        livePhotoUrl: livePhotoUpload.url
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
    const {email, password} = req.body

    if(!email || !password) throw new ApiError(400, "Email and password are required !")

    const user = await User.findOne({email})

    if(!user) throw new ApiError(404, "User not found !")

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

const updateLivePhoto = asyncHandler(async (req, res)=>{
    const livePhotoLocalPath = req.file?.path

    if(!livePhotoLocalPath) throw new ApiError(403, "File is missing")

    const livePhoto = await uploadOnCloudinary(livePhotoLocalPath)

    if(!livePhoto.url) throw new ApiError(401, "Live Photo is missing !")

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                livePhoto: livePhoto.url
            }
        },
        {new: true}
    ). select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Live Photo updated succesfully !"))
})

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
        const { email, height, weight, address } = req.body;

        if ( !email || !height || !weight || !address) {
            throw new ApiError(400, "All fields are required!");
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            { $set: { email, height, weight, address } },
            { new: true }
        ).select("-password -refreshToken");

        return res
            .status(200)
            .json(new ApiResponse(200, updatedUser, "User Account Updated Successfully!"));
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

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update the user document directly without full validation
    const updatedUser = await User.findOneAndUpdate(
        { email },
        {
            $set: {
                emailOTP: otp,
                OTPExpiry: Date.now() + 10 * 60 * 1000, // 10 mins expiry
            },
        },
        { new: true } // Return the updated document
    );

    // If the update was not successful for some reason
    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user for password reset");
    }

    // Send Email
    await sendEmailOtp(email, otp);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "OTP sent to your email for password reset"));
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        throw new ApiError(400, "Email, OTP, and new password are required");
    }

    // Find the user and verify the OTP and its expiry in a single query
    const user = await User.findOne({
        email,
        emailOTP: otp,
        OTPExpiry: { $gt: Date.now() }, // $gt checks if OTPExpiry is greater than now
    });

    if (!user) {
        // We use a generic message to prevent an attacker from knowing
        // whether the email was wrong, the OTP was wrong, or the OTP expired.
        throw new ApiError(400, "Invalid or expired OTP or user not found");
    }

    // Update the password and clear OTP fields directly
    user.password = newPassword;
    user.emailOTP = undefined;
    user.OTPExpiry = undefined;

    // Save the changes. The findOne and subsequent save is fine here because
    // we've already found the user with the required fields. However, for a cleaner and
    // more atomic operation, we can use findOneAndUpdate here as well.
    const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
            $set: {
                password: newPassword,
                emailOTP: undefined,
                OTPExpiry: undefined,
            },
        },
        { new: true, runValidators: true } // Run validators to hash the password
    );

    if (!updatedUser) {
        throw new ApiError(500, "Password reset failed. Please try again.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successful"));
});

const getWeightHistory = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("weightHistory");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user.weightHistory, "Weight history fetched successfully"));
});

import { MembershipPlan } from "../models/membershipplan.model.js";

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
    sendOTP,
    verifyOTP,
    registerUser,
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