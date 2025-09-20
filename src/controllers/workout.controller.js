import { UserWorkoutSchedule } from "../models/workout.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE OR UPDATE SCHEDULE ----------------
const createOrUpdateSchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const scheduleData = req.body; // { monday: [...], tuesday: [...], ... }

    // Find if schedule exists for this user
    let schedule = await UserWorkoutSchedule.findOne({ user: userId });

    if (schedule) {
      // Update existing schedule
      Object.assign(schedule.schedule, scheduleData);
      await schedule.save();
    } else {
      // Create new schedule
      schedule = await UserWorkoutSchedule.create({
        user: userId,
        schedule: scheduleData
      });
    }

    // ✅ Also update the user's customWorkoutSchedule
    await User.findByIdAndUpdate(
      userId,
      { customWorkoutSchedule: scheduleData },
      { new: true }
    );

    res.status(200).json(new ApiResponse(true, "Schedule saved", schedule));
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
}