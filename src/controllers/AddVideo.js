import WorkoutVideo from '../models/workout.model.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {ApiError} from '../utils/ApiError.js';

// Add video(s) to a muscle group
export const addVideo = async (req, res) => {
  const { muscle, videos } = req.body;
  if (!muscle || !videos || !Array.isArray(videos) || videos.length === 0) {
    return res.status(400).json(new ApiError(400, 'Muscle name and videos array required'));
  }
  try {
    let workout = await WorkoutVideo.findOne({ muscle });
    if (workout) {
      // Append new videos, avoid duplicates
      const newVideos = videos.filter(v => !workout.videos.includes(v));
      workout.videos.push(...newVideos);
      await workout.save();
      return res.status(200).json(new ApiResponse(200, workout, 'Videos added to existing muscle group'));
    } else {
      workout = await WorkoutVideo.create({ muscle, videos });
      return res.status(201).json(new ApiResponse(201, workout, 'Muscle group and videos created'));
    }
  } catch (err) {
    return res.status(500).json(new ApiError(500, err.message));
  }
};
