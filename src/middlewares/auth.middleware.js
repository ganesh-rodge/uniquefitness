import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  // 1️⃣ Get token from cookie or header
  const token =
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Unauthorized. Token not found");

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Unauthorized. Invalid token");
  }

  // 2️⃣ Find user/admin
  let user = await User.findById(decodedToken._id);
  if (!user) user = await Admin.findById(decodedToken._id);

  if (!user) throw new ApiError(401, "Unauthorized. User not found");

  // 3️⃣ Attach user to request
  req.user = {
    ...user.toObject(),
    _id: user._id.toString(),
  };

  next();
});
