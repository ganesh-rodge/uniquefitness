import WorkoutVideo from '../models/workout.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

// Update a video link for a muscle group
export const updateVideo = async (req, res) => {
  const { muscle, oldVideo, newVideo } = req.body;
  if (!muscle || !oldVideo || !newVideo) {
    return res.status(400).json(new ApiError(400, 'Muscle name, old video link, and new video link required'));
  }
  try {
    const workout = await WorkoutVideo.findOne({ muscle });
    if (!workout) {
      return res.status(404).json(new ApiError(404, 'Muscle group not found'));
    }
    const index = workout.videos.indexOf(oldVideo);
    if (index === -1) {
      return res.status(404).json(new ApiError(404, 'Old video link not found for this muscle group'));
    }
    workout.videos[index] = newVideo;
    await workout.save();
    return res.status(200).json(new ApiResponse(200, workout, 'Video link updated for muscle group'));
  } catch (err) {
    return res.status(500).json(new ApiError(500, err.message));
  }
};
