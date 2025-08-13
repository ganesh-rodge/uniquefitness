import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))

app.use(cookieParser())
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

import healthcheckRouter from './routes/healthcheck.route.js'
import userRouter from './routes/user.route.js'
import adminRouter from "./routes/admin.route.js"


app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/user", userRouter)
app.use("/api/v1/admin", adminRouter)

export default app