import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    fullNmae: {
        type: String, 
        required: true
    },
    mobileNumber:{
        type: String,
        required: true,
        unique: true
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
    isEmailVerified:{
        type: Boolean,
        default: false
    },
    isPhoneVerified:{
        type: Boolean,
        default: false
    },

    emailOTP: {
        type: String
    },
    phoneOTP: {
        type: String
    },
    OTPExpiry:{
        type: Date
    },
    height:{
        type: Number,
        required: true
    },
    weight:{
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gender:{
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    dob:{
        type: Date,
        required: true
    },


    aadhaarPhotoUrl:{
        type: String,
        required: true
    },
    livePhotoUrl:{
        type: String,
        required: true
    },
    

    membership:{
        planId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "MembershipPlan"
        },
        startDate:{
            type: Date
        },
        endDate:{
            type: Date
        },
        status:{
            type: String,
            enum: ['active', 'expired', 'inactive'],
            default: 'inactive'
        }
    },

    
    customWorkoutSchedule : [
        {
            day: {
                type: String,
                required: String
            },
            workouts:[
                {
                    workoutId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: Workout,
                        required: true
                    }
                }
            ]
        }
    ],

    weightHistory:[
        {
            date : {
                type: Date,
                default: Date.now
            },
            weight: {
                type: Number
            }
        }
    ],


    role: {
        type: String,
        enum: ['member'],
        default: 'member'
    }
},
{
    timestamps: true
})

userSchema.pre("save", async function(next) {
    if(!this.modified("password")) return next()

    try {
        this.password = bcrypt.hash(this.password, 10)
    
        next()
    } catch (error) {
        console.log("Error hashing the passoword : ", error)
        next(error)
    }
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    );
}

userSchema.methods.generateAccessToken = async function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

export const User = mongoose.model("User", userSchema)