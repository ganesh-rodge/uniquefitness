// workout controller (corrected)

import { UserWorkoutSchedule } from "../models/workout.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const scheduleData = req.body; 

        // Update or create the schedule in the UserWorkoutSchedule collection
        let schedule = await UserWorkoutSchedule.findOne({ user: userId });
        if (schedule) {
            schedule.schedule = scheduleData;
            await schedule.save();
        } else {
            schedule = await UserWorkoutSchedule.create({
                user: userId,
                schedule: scheduleData
            });
        }

        // Also save to User's customWorkoutSchedule
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiResponse(false, "User not found"));
        }

        const transformedSchedule = Object.entries(scheduleData).map(([day, workouts]) => ({
            day,
            workouts
        }));

        const existingSchedule = user.customWorkoutSchedule || [];

        transformedSchedule.forEach(newDay => {
            const index = existingSchedule.findIndex(d => d.day.toLowerCase() === newDay.day.toLowerCase());
            if (index > -1) {
                existingSchedule[index] = newDay; 
            } else {
                existingSchedule.push(newDay); 
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

        const scheduleDoc = await UserWorkoutSchedule.findOne({ user: userId });
        
        if (!scheduleDoc || !scheduleDoc.schedule) {
            return res.status(200).json(new ApiResponse(true, "No schedule found", []));
        }

        // Transform the schedule object into an array for the frontend
        const formattedSchedule = Object.entries(scheduleDoc.schedule).map(([day, workouts]) => ({
            day,
            workouts
        }));

        res.status(200).json(new ApiResponse(true, "User schedule fetched", formattedSchedule));

    } catch (error) {
        console.error("Error in getUserSchedule:", error);
        next(error);
    }
};

export {
    createOrUpdateSchedule,
    getUserSchedule
};