import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session"; // <-- Added
import mysql from "mysql2/promise"; // <-- Added
import router from "./routes/index.js";

const app: Express = express();
app.set("trust proxy", 1);
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/.test(origin)) {
                return callback(null, true);
            }
            // Add your Hostinger frontend domain here if deploying a web version
            if (origin === 'https://crm.outhillsmanali.com') return callback(null, true);
            callback(new Error('Origin not allowed by CORS'));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- PRODUCTION SESSION STORE SETUP ---
const MySQLStore = MySQLStoreFactory(session as any);

// Create a database connection specifically for sessions
const sessionDbPool = mysql.createPool(process.env.DATABASE_URL || "mysql://root@127.0.0.1:3306/db_name");

const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // Check for expired sessions every 15 minutes
    expiration: 1000 * 60 * 60 * 24 * 7, // 7 days
}, sessionDbPool);
// --------------------------------------

app.use(
    session({
        secret: process.env.SESSION_SECRET || "super-secure-session-secret-key",
        store: sessionStore,       // <-- Crucial: Tells Express to use MySQL, not memory
        resave: false,
        saveUninitialized: false,
        name: "hotel.sid",
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax",
        },
    })
);

app.use("/api", router);

export default app;