import { Router } from "express";
import { db } from "@workspace/db";
import { agenciesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const agencies = await db.select().from(agenciesTable).where(eq(agenciesTable.hotelId, hotelId));
  res.json(agencies);
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const { name } = req.body;
  const result = await db
    .insert(agenciesTable)
    .values({ name, hotelId });
  const created = await db
    .select()
    .from(agenciesTable)
    .where(eq(agenciesTable.id, (result as any).insertId));
  res.status(201).json(created[0]);
});

router.put("/:agencyId", authenticate, async (req, res) => {
  const agencyId = parseInt(req.params.agencyId);
  const { name } = req.body;
  await db
    .update(agenciesTable)
    .set({ name })
    .where(eq(agenciesTable.id, agencyId));
  const updated = await db
    .select()
    .from(agenciesTable)
    .where(eq(agenciesTable.id, agencyId));
  res.json(updated[0]);
});

router.delete("/:agencyId", authenticate, async (req, res) => {
  const agencyId = parseInt(req.params.agencyId);
  await db.delete(agenciesTable).where(eq(agenciesTable.id, agencyId));
  res.json({ success: true, message: "Agency deleted" });
});

export default router;
