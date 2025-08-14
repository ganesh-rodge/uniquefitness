import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import {ApiError} from '../utils/ApiError.js'

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user = await User.findById(decodedToken?._id);
    if (!user) {
        user = await Admin.findById(decodedToken?._id);
    }

    if (!user) throw new ApiError(401, "Unauthorized");

    req.user = {
        ...user.toObject(),
        _id: user._id.toString()
    };
    next();
});
