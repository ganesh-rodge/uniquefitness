import mongoose from "mongoose";

const dietSchema = new mongoose.Schema({
    category:{
        type: String,
        enum: ['veg', 'non-veg', 'egg-only'],
        required: true
    },
    items:[
        {
            name: {
                type: String,
                required: true
            },
            calories:{
                type: Number
            },
            protein: {
                type: Number
            },
            carbs: {
                type: Number
            },
            fats: {
                type: Number
            }
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
},
{timestamps: true})

export const Diet = mongoose.model("Diet", dietSchema)