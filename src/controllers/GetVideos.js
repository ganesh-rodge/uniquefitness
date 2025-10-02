import WorkoutVideo from '../models/workout.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Get video links for a muscle group
export const getVideos = async (req, res) => {
  const { muscle } = req.query;
  if (!muscle) {
    return res.status(400).json(new ApiError(400, 'Muscle name required as query parameter'));
  }
  try {
    // Case-insensitive search for muscle name
    const workout = await WorkoutVideo.findOne({ muscle: new RegExp(`^${muscle}$`, 'i') });
    if (!workout) {
      return res.status(404).json(new ApiError(404, 'Muscle group not found'));
    }
    return res.status(200).json(new ApiResponse(200, workout.videos, 'Video links fetched'));
  } catch (err) {
    return res.status(500).json(new ApiError(500, err.message));
  }
};
