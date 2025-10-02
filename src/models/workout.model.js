import mongoose from 'mongoose';

const WorkoutVideoSchema = new mongoose.Schema({
  muscle: {
    type: String,
    required: true,
    unique: true
  },
  videos: [
    {
      type: String, // YouTube video link
      required: true
    }
  ]
});

const WorkoutVideo = mongoose.model('WorkoutVideo', WorkoutVideoSchema);
export default WorkoutVideo;