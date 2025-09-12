import express from "express";
import { sendOTP, verifyOTP, registerUser, loginUser, logoutUser, updateLivePhoto, getCurrentUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, updateWeight, forgotPassword, getWeightHistory, linkMembershipToUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"; // for Aadhaar & live photo upload
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { resetPassword } from "../controllers/user.controller.js";


const router = express.Router();

// Step 1: Send OTP to email
router.post("/send-otp", sendOTP);

// Step 2: Verify OTP and return signup token
router.post("/verify-otp", verifyOTP);

// Step 3: Register user (needs signupToken from step 2)
router.post(
  "/register",
  upload.fields([
    { name: "aadhaarPhoto", maxCount: 1 },
    { name: "livePhoto", maxCount: 1 }
  ]),
  registerUser
);

router.post("/login", loginUser)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/get-user",verifyJWT, getCurrentUser)
router.post("/refresh-token", refreshAccessToken)

router.post("/logout", verifyJWT, logoutUser)
router.patch(
    "/update-photo",
    verifyJWT,
    upload.single("livePhoto"), 
    updateLivePhoto
);
router.patch("/change-password", verifyJWT, changeCurrentPassword)
router.patch("/update-info", verifyJWT, updateAccountDetails)
router.patch("/update-weight", verifyJWT, updateWeight)

router.get("/weight-history", verifyJWT, getWeightHistory);
router.patch("/membership", verifyJWT, linkMembershipToUser);


export default router;
