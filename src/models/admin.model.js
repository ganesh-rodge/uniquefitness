import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const AdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ["admin"],
        default: "admin"
    },
    gymLogoUrl:{
        type: String
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
});

/* ---------- Pre-save hook for password hashing ---------- */
AdminSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

/* ---------- Compare password ---------- */
AdminSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

/* ---------- Generate Access Token ---------- */
AdminSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        { _id: this._id, role: this.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

/* ---------- Generate Refresh Token ---------- */
AdminSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { _id: this._id, role: this.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const Admin = mongoose.model("Admin", AdminSchema);
