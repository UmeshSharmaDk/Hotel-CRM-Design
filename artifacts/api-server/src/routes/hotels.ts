import { Router } from "express";
import { db } from "@workspace/db";
import { hotelsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireRole, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === "admin") {
    const hotels = await db.select().from(hotelsTable);
    res.json(hotels);
  } else if (user.hotelId) {
    const hotels = await db.select().from(hotelsTable).where(eq(hotelsTable.id, user.hotelId));
    res.json(hotels);
  } else {
    res.json([]);
  }
});

router.post("/", authenticate, requireRole("admin"), async (req, res) => {
  const { name, totalRooms, planStartDate, planEndDate } = req.body;
  const result = await db.insert(hotelsTable).values({ name, totalRooms, planStartDate, planEndDate });
  const created = await db
    .select()
    .from(hotelsTable)
    .where(eq(hotelsTable.id, (result as any).insertId));
  res.status(201).json(created[0]);
});

router.put("/:id", authenticate, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, totalRooms, planStartDate, planEndDate } = req.body;
  await db
    .update(hotelsTable)
    .set({ name, totalRooms, planStartDate, planEndDate })
    .where(eq(hotelsTable.id, id));
  const updated = await db
    .select()
    .from(hotelsTable)
    .where(eq(hotelsTable.id, id));
  res.json(updated[0]);
});

router.delete("/:id", authenticate, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.hotelId, id));
  await db.delete(hotelsTable).where(eq(hotelsTable.id, id));
  res.json({ success: true, message: "Hotel deleted" });
});

export default router;
