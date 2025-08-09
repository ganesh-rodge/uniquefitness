import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: String
    },
    price:{
        type: Number,
        required: String
    },
    durationDays:{
        type: Number,
        required: true
    },
    description:{
        type: String
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
},
{
    timestamps: true
})

export const MembershipPlan = mongoose.model("MembershipPlan", membershipPlanSchema)