import WorkoutVideo from '../models/workout.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Delete a video link from a muscle group
export const deleteVideo = async (req, res) => {
  const { muscle, video } = req.body;
  if (!muscle || !video) {
    return res.status(400).json(new ApiError(400, 'Muscle name and video link required'));
  }
  try {
    const workout = await WorkoutVideo.findOne({ muscle });
    if (!workout) {
      return res.status(404).json(new ApiError(404, 'Muscle group not found'));
    }
    const index = workout.videos.indexOf(video);
    if (index === -1) {
      return res.status(404).json(new ApiError(404, 'Video link not found for this muscle group'));
    }
    workout.videos.splice(index, 1);
    await workout.save();
    return res.status(200).json(new ApiResponse(200, workout, 'Video deleted from muscle group'));
  } catch (err) {
    return res.status(500).json(new ApiError(500, err.message));
  }
};
