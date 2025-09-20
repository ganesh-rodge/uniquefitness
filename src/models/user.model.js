import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String, 
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    phone:{
        type:Number,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    emailOTP: {
        type: String
    },
    OTPExpiry:{
        type: Date
    },
    height:{
        type: Number,
        required: true
    },
    weight:{
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gender:{
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    dob:{
        type: Date,
        required: true
    },
    aadhaarPhotoUrl:{
        type: String,
        required: true
    },
    livePhotoUrl:{
        type: String,
        required: true
    },
    membership:{
        planId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "MembershipPlan"
        },
        startDate:{
            type: Date
        },
        endDate:{
            type: Date
        },
        status:{
            type: String,
            enum: ['active', 'expired', 'inactive'],
            default: 'inactive'
        }
    },
    customWorkoutSchedule: {
  type: Map,
  of: [String],
  default: {} // ensures new users start with empty object
},
weightHistory:[
    {
        date : {
            type: Date,
            default: Date.now
        },
        weight: {
            type: Number
        }
    }
],
    role: {
        type: String,
        enum: ['member'],
        default: 'member'
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true });

// 🔹 Pre-save hook: hash password
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        console.log("Error hashing the password:", error);
        next(error);
    }
});

// 🔹 Compare password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// 🔹 Generate Access Token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// 🔹 Generate Refresh Token
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);
