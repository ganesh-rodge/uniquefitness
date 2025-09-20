import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scheduleData = req.body; // e.g. { monday: ["chest"], sunday: ["cardio"] }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(false, "User not found"));
        }

        // Ensure customWorkoutSchedule is initialized as a Map
        if (!user.customWorkoutSchedule || !(user.customWorkoutSchedule instanceof Map)) {
            user.customWorkoutSchedule = new Map();
        }

        // Merge new data into existing schedule
        for (const [day, workouts] of Object.entries(scheduleData)) {
            user.customWorkoutSchedule.set(day.toLowerCase(), workouts);
        }

        await user.save();

        res.status(200).json(
            new ApiResponse(true, "Schedule saved successfully", user.customWorkoutSchedule)
        );
    } catch (error) {
        console.error("Error in createOrUpdateSchedule:", error);
        next(error);
    }
};

// ---------------- GET USER SCHEDULE ----------------
const getUserSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(false, "User not found"));
        }

        res.status(200).json(
            new ApiResponse(true, "User schedule fetched", user.customWorkoutSchedule || {})
        );
    } catch (error) {
        console.error("Error in getUserSchedule:", error);
        next(error);
    }
};

export {
    createOrUpdateSchedule,
    getUserSchedule
};
