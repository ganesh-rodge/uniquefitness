import { UserWorkoutSchedule } from "../models/workout.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scheduleData = req.body; // expect { monday: [...], tuesday: [...], ... }

        // Transform incoming data to match customWorkoutSchedule schema
        const transformedSchedule = Object.entries(scheduleData).map(([day, workouts]) => ({
            day,
            workouts: workouts.map(name => ({ name })) // store workout names
        }));

        // Save to UserWorkoutSchedule collection
        let schedule = await UserWorkoutSchedule.findOne({ user: userId });
        if (schedule) {
            schedule.schedule = transformedSchedule;
            await schedule.save();
        } else {
            schedule = await UserWorkoutSchedule.create({
                user: userId,
                schedule: transformedSchedule
            });
        }

        // Also save to User's customWorkoutSchedule
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(false, "User not found"));
        }

        // Merge existing customWorkoutSchedule with new days
        const existingSchedule = user.customWorkoutSchedule || [];

        transformedSchedule.forEach(newDay => {
            const index = existingSchedule.findIndex(d => d.day === newDay.day);
            if (index > -1) {
                existingSchedule[index] = newDay; // update existing day
            } else {
                existingSchedule.push(newDay); // add new day
            }
        });

        user.customWorkoutSchedule = existingSchedule;
        await user.save();

        res.status(200).json(new ApiResponse(true, "Schedule saved successfully", { schedule, user }));
    } catch (error) {
        console.error("Error in createOrUpdateSchedule:", error);
        next(error);
    }
};

// ---------------- GET USER SCHEDULE ----------------
const getUserSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const schedule = await UserWorkoutSchedule.findOne({ user: userId });
        if (!schedule) {
            return res.status(404).json(new ApiResponse(false, "No schedule found"));
        }

        res.status(200).json(new ApiResponse(true, "User schedule fetched", schedule));
    } catch (error) {
        next(error);
    }
};

export {
    createOrUpdateSchedule,
    getUserSchedule
};
