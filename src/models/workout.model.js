import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['chest', 'back', 'legs', 'arms', 'shoulders', 'cardio', 'triceps', 'biceps'],
        required: true
    },
    description: {
        type: String
    },
    videoUrl: {
        type: String,
        required: true
    },
    thumbnailUrl:{
        type: String
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    }
},
{
    timestamps: true
});

export const Workout = mongoose.model("Workout", workoutSchema)