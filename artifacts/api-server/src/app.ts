import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes/index.js";

const app: Express = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || true,
        credentials: true, // Crucial: Allows the frontend to send and receive cookies
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Server-Side Sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET || "super-secure-session-secret-key",
        resave: false,             // Avoid unnecessary database writes
        saveUninitialized: false,  // Do not save empty sessions
        name: "hotel.sid",         // Obfuscate standard connect.sid name
        cookie: {
            secure: process.env.NODE_ENV === "production", // Requires HTTPS in production
            httpOnly: true, // Prevents JavaScript from accessing the cookie (XSS protection)
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax", // CSRF protection
        },
    })
);

app.use("/api", router);

export default app;