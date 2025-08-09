import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        requierd: true
    },
    content: {
        type: String, 
        required: true
    },
    publishDate:{
        type: Date,
        default: Date.now
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
},
{
    timestamps: true
})

export const Announcement =  mongoose.model("Announcement", announcementSchema)