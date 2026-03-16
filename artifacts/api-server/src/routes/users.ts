import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, requireRole, hashPassword, AuthRequest } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const user = req.user!;

  if (user.role === "hotel_manager" && user.hotelId !== hotelId) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.hotelId, hotelId));
  res.json(users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hotelId: u.hotelId,
  })));
});

router.post("/", authenticate, requireRole("admin", "hotel_owner"), async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const { name, email, password, role } = req.body;

  const created = await db
    .insert(usersTable)
    .values({ name, email, password: hashPassword(password), role, hotelId })
    .returning();

  const u = created[0];
  res.status(201).json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    hotelId: u.hotelId,
  });
});

router.put("/:userId", authenticate, requireRole("admin", "hotel_owner"), async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.userId);
  const { name, email, role, password } = req.body;

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (password) updates.password = hashPassword(password);

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

router.delete("/:userId", authenticate, requireRole("admin", "hotel_owner"), async (req, res) => {
  const userId = parseInt(req.params.userId);
  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ success: true, message: "User deleted" });
});

export default router;
