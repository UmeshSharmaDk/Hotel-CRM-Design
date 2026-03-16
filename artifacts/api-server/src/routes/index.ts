import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import hotelsRouter from "./hotels.js";
import usersRouter from "./users.js";
import bookingsRouter from "./bookings.js";
import agenciesRouter from "./agencies.js";
import roomTypesRouter from "./roomTypes.js";
import analyticsRouter from "./analytics.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/hotels", hotelsRouter);
router.use("/hotels/:hotelId/users", usersRouter);
router.use("/hotels/:hotelId/bookings", bookingsRouter);
router.use("/hotels/:hotelId/agencies", agenciesRouter);
router.use("/hotels/:hotelId/room-types", roomTypesRouter);
router.use("/hotels/:hotelId", analyticsRouter);

export default router;
