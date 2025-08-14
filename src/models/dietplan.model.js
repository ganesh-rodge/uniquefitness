import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    calories: {
        type: Number,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "creatorModel", // reference dynamic model (User or Admin)
        required: true
    },
    creatorModel: {
        type: String,
        required: true,
        enum: ["User", "Admin"] // can only be one of these
    },
    isDefault: {
        type: Boolean,
        default: false // admin plans: true, user plans: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const DietPlan = mongoose.model("DietPlan", dietPlanSchema);
