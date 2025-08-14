import mongoose from "mongoose";

const userWorkoutScheduleSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    schedule: {
        monday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        tuesday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        wednesday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        thursday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        friday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        saturday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }],
        sunday: [{ type: String, enum: ['chest', 'triceps', 'shoulders', 'back', 'biceps', 'legs', 'arms', 'abs', 'full body', 'cardio'] }]
    }
}, {
    timestamps: true
});

export const UserWorkoutSchedule = mongoose.model("UserWorkoutSchedule", userWorkoutScheduleSchema);
