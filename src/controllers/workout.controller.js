import { UserWorkoutSchedule } from "../models/workout.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const scheduleData = req.body; // { monday: ["chest", "triceps"], ... }

    // ------------------ 1. Update UserWorkoutSchedule ------------------
    let schedule = await UserWorkoutSchedule.findOne({ user: userId });

    if (schedule) {
      // Merge existing schedule with new data
      Object.assign(schedule.schedule, scheduleData);
      await schedule.save();
    } else {
      // Create new schedule
      schedule = await UserWorkoutSchedule.create({
        user: userId,
        schedule: scheduleData
      });
    }

    // ------------------ 2. Update user's customWorkoutSchedule ------------------
    const transformedSchedule = Object.entries(scheduleData).map(([day, workouts]) => ({
      day,
      workouts: workouts.map(workoutId => ({ workoutId })) // ensure workoutId is ObjectId
    }));

    // Fetch user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(new ApiResponse(false, "User not found"));
    }

    // Merge existing customWorkoutSchedule with new/updated days
    transformedSchedule.forEach((newDaySchedule) => {
      const existingDayIndex = user.customWorkoutSchedule.findIndex(
        (d) => d.day.toLowerCase() === newDaySchedule.day.toLowerCase()
      );

      if (existingDayIndex > -1) {
        // Replace workouts for that day
        user.customWorkoutSchedule[existingDayIndex].workouts = newDaySchedule.workouts;
      } else {
        // Add new day
        user.customWorkoutSchedule.push(newDaySchedule);
      }
    });

    await user.save();

    res.status(200).json(new ApiResponse(true, "Schedule updated successfully", {
      userSchedule: user.customWorkoutSchedule,
      workoutSchedule: schedule.schedule
    }));
    
  } catch (error) {
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
