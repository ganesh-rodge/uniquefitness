import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    action: { type: String, required: true },
    resourceType: { type: String, required: true }, // e.g., 'dietplan', 'user', 'workoutVideo'
    resourceId: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export const Activity = mongoose.model('Activity', ActivitySchema);
