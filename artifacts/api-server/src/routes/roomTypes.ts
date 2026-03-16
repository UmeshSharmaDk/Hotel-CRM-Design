import { Router } from "express";
import { db } from "@workspace/db";
import { roomTypesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const roomTypes = await db.select().from(roomTypesTable).where(eq(roomTypesTable.hotelId, hotelId));
  res.json(roomTypes);
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const { name, pricePerNight } = req.body;
  const created = await db
    .insert(roomTypesTable)
    .values({ name, hotelId, pricePerNight: pricePerNight.toString() })
    .returning();
  res.status(201).json(created[0]);
});

router.put("/:roomTypeId", authenticate, async (req, res) => {
  const roomTypeId = parseInt(req.params.roomTypeId);
  const { name, pricePerNight } = req.body;
  const updated = await db
    .update(roomTypesTable)
    .set({ name, pricePerNight: pricePerNight.toString() })
    .where(eq(roomTypesTable.id, roomTypeId))
    .returning();
  res.json(updated[0]);
});

router.delete("/:roomTypeId", authenticate, async (req, res) => {
  const roomTypeId = parseInt(req.params.roomTypeId);
  await db.delete(roomTypesTable).where(eq(roomTypesTable.id, roomTypeId));
  res.json({ success: true, message: "Room type deleted" });
});

export default router;
