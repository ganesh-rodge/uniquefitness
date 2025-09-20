// workout controller (corrected)

import { UserWorkoutSchedule } from "../models/workout.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
    try {
        const userId = req.user._id;
        // The schedule data from the frontend is already in the correct format for the
        // UserWorkoutSchedule model: { monday: ['chest'], sunday: ['cardio'] }
        const scheduleData = req.body; 

        // Update or create the schedule in the UserWorkoutSchedule collection
        let schedule = await UserWorkoutSchedule.findOne({ user: userId });
        if (schedule) {
            // Directly assign the incoming object to the 'schedule' field
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

        // Transform the incoming data to match the User's customWorkoutSchedule array format
        const transformedSchedule = Object.entries(scheduleData).map(([day, workouts]) => ({
            day,
            workouts: workouts.map(name => ({ name }))
        }));

        // Merge existing customWorkoutSchedule with new days
        const existingSchedule = user.customWorkoutSchedule || [];

        transformedSchedule.forEach(newDay => {
            const index = existingSchedule.findIndex(d => d.day === newDay.day);
            if (index > -1) {
                // Update existing day
                existingSchedule[index] = newDay; 
            } else {
                // Add new day
                existingSchedule.push(newDay); 
            }
        });

        // This line must be added to trigger the update
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
        
        // If a schedule document is not found, return an empty array.
        // This is crucial to prevent the TypeError on the frontend.
        if (!scheduleDoc || !scheduleDoc.schedule) {
            return res.status(200).json(new ApiResponse(true, "No schedule found", []));
        }

        // The schedule is an object { monday: [...], tuesday: [...] }
        // We need to transform it into an array for the frontend to use .forEach()
        const formattedSchedule = Object.entries(scheduleDoc.schedule).map(([day, workouts]) => ({
            day,
            workouts: workouts
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