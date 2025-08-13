import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String, 
        required: true
    },
    publishDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const Announcement = mongoose.model("Announcement", announcementSchema);
