import mongoose from "mongoose";

const hexTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  prefix: {
    type: String,
    enum: ["b1", "b2"],
    required: true,
  },
  purpose: {
    type: String,
    enum: ["registration", "password-reset"],
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedAt: {
    type: Date,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

export const HexToken = mongoose.model("HexToken", hexTokenSchema);
