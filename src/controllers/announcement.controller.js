import { Announcement } from "../models/announcement.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// ---------------- CREATE ANNOUNCEMENT ----------------
const createAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json(new ApiResponse(true, "Announcement created", announcement));
    } catch (error) {
        next(error);
    }
};

// ---------------- UPDATE ANNOUNCEMENT ----------------
const updateAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            { $set: { ...req.body, publishDate: Date.now() } }, // Use $set to update specific fields
            { new: true, runValidators: true }
        );

        if (!announcement) {
            return res.status(404).json(new ApiResponse(false, "Announcement not found"));
        }

        res.status(200).json(new ApiResponse(true, "Announcement updated", announcement));
    } catch (error) {
        next(error);
    }
};

// ---------------- DELETE ANNOUNCEMENT ----------------
const deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return res.status(404).json(new ApiResponse(false, "Announcement not found"));
        }
        res.status(200).json(new ApiResponse(true, "Announcement deleted"));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET ALL ANNOUNCEMENTS (latest first) ----------------
const getAllAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find().sort({ publishDate: -1 }); // latest first
        res.status(200).json(new ApiResponse(true, "Announcements fetched", announcements));
    } catch (error) {
        next(error);
    }
};

// ---------------- GET SINGLE ANNOUNCEMENT ----------------
const getAnnouncement = async (req, res, next) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return res.status(404).json(new ApiResponse(false, "Announcement not found"));
        }
        res.status(200).json(new ApiResponse(true, "Announcement fetched", announcement));
    } catch (error) {
        next(error);
    }
};


export {
    getAllAnnouncements,
    getAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    createAnnouncement
}