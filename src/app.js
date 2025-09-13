import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser())

app.use(
  cors({
    origin: "*", // or your frontend domain
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);


import healthcheckRouter from './routes/healthcheck.route.js'
import userRouter from './routes/user.route.js'
import adminRouter from "./routes/admin.route.js"
import announcementRouter from './routes/announcement.route.js'
import membershipRouter from "./routes/membership.route.js"
import dietplanRouter from "./routes/diet.route.js"
import workoutRouter from "./routes/workout.route.js"
import paymentRouter from "./routes/payment.route.js"

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/announcement", announcementRouter)
app.use("/api/v1/membership", membershipRouter)
app.use("/api/v1/dietplan", dietplanRouter)
app.use("/api/v1/workout", workoutRouter)
app.use("/api/v1/payment", paymentRouter)

export default app