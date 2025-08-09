import mongoose, { mongo } from 'mongoose'


const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    planId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipPlan'
    },
    amount:{
        type: Number,
        required: true
    },
    currency:{
        type: String,
        default: 'INR'
    },
    paymentStatus: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        required: true
    },
    paymentGateway:{
        type: String,
        enum: ['razorpay', 'stripe'],
        default: 'razorpay'
    },
    transactionId:{
        type: String
    },
    date:{
        type: Date,
        default: Date.now
    }
},
{
    timestamps: true
})

export const Payment = mongoose.model("Payment", paymentSchema)