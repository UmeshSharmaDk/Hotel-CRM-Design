import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, hotelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  authenticate,
  comparePassword,
  generateToken,
  hashPassword,
  AuthRequest,
} from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
  const user = users[0];

  if (!user || !comparePassword(password, user.password)) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  let planExpired = false;
  if (user.role !== "admin" && user.hotelId) {
    const hotels = await db.select().from(hotelsTable).where(eq(hotelsTable.id, user.hotelId));
    const hotel = hotels[0];
    if (hotel) {
      const today = new Date().toISOString().split("T")[0];
      if (hotel.planEndDate < today) {
        planExpired = true;
      }
    }
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    hotelId: user.hotelId ?? null,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hotelId: user.hotelId,
    },
    planExpired,
  });
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hotelId: user.hotelId,
  });
});

router.put("/update-profile", authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { name, currentPassword, newPassword } = req.body;

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const user = users[0];
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const updates: Partial<typeof user> = {};
  if (name) updates.name = name;

  if (newPassword) {
    if (!currentPassword || !comparePassword(currentPassword, user.password)) {
      res.status(400).json({ message: "Current password is incorrect" });
      return;
    }
    updates.password = hashPassword(newPassword);
  }

  const updated = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  const u = updated[0];
  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hotelId: u.hotelId,
  });
});

export default router;
