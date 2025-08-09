import mongoose, { mongo } from "mongoose";

const AdminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ["admin"],
        default: "admin"
    },
    gymLogoUrl:{
        type: String
    }
},
{
    timestamps: true
})

export const Admin = mongoose.model("Admin", AdminSchema)