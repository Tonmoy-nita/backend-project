import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { ApiError } from "./utils/ApiError.js";

const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true,
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//import routes

import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

//routes declaration

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/comments", commentRouter)

// centralized error handler to avoid noisy stacks for expected errors (e.g., username availability 404)
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);

    const statusCode = err instanceof ApiError ? err.statusCode : 500;
    const message = err?.message || "Something went wrong";

    // only log unexpected server errors
    if (statusCode >= 500) {
        console.error(err);
    }

    return res.status(statusCode).json({
        success: statusCode < 400,
        statusCode,
        message,
        data: null,
        errors: err?.errors || [],
    });
});

export { app };

