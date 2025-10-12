import { Activity } from '../models/activity.model.js';

export async function logActivity({ actor, action, resourceType, resourceId, metadata }) {
  try {
    await Activity.create({ actor, action, resourceType, resourceId, metadata });
  } catch (err) {
    // Non-blocking: log error but do not throw
    console.error('Failed to log activity:', err?.message || err);
  }
}
