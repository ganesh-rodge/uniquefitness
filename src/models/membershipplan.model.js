import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in months
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    branch: { type: String, enum: ["b1", "b2"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    createdAt: { type: Date, default: Date.now }
});

export const MembershipPlan = mongoose.models.MembershipPlan || mongoose.model("MembershipPlan", membershipPlanSchema);
