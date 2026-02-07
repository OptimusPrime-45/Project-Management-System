import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// cors configuration - Must be before other middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({limit: "10mb"}));    // Increased limit for profile images
app.use(express.urlencoded({extended: true, limit: '10mb'})); // Increased limit for profile images
app.use(express.static("public")); // Middleware to serve static files from the "public" directory
app.use(cookieParser()); // Middleware to parse cookies

// import the routes
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";
import noteRouter from "./routes/note.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import documentRouter from "./routes/document.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/super-admin", superAdminRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/projects", taskRouter);
app.use("/api/v1/projects", noteRouter);
app.use("/api/v1/projects", documentRouter);
app.use("/api/v1/notifications", notificationRouter);

app.get("/", (req, res) => {
    res.send("Welcome to BaseCampy");
})

export default app;