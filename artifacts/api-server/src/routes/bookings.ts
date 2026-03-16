import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, agenciesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);

  const bookings = await db
    .select({
      id: bookingsTable.id,
      hotelId: bookingsTable.hotelId,
      guestName: bookingsTable.guestName,
      guestEmail: bookingsTable.guestEmail,
      guestPhone: bookingsTable.guestPhone,
      roomType: bookingsTable.roomType,
      checkIn: bookingsTable.checkIn,
      checkOut: bookingsTable.checkOut,
      rooms: bookingsTable.rooms,
      status: bookingsTable.status,
      agencyId: bookingsTable.agencyId,
      agencyName: agenciesTable.name,
      totalCost: bookingsTable.totalCost,
      dueBalance: bookingsTable.dueBalance,
      notes: bookingsTable.notes,
    })
    .from(bookingsTable)
    .leftJoin(agenciesTable, eq(bookingsTable.agencyId, agenciesTable.id))
    .where(eq(bookingsTable.hotelId, hotelId));

  res.json(bookings);
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const {
    guestName, guestEmail, guestPhone, roomType,
    checkIn, checkOut, rooms, status, agencyId,
    totalCost, dueBalance, notes
  } = req.body;

  const created = await db
    .insert(bookingsTable)
    .values({
      hotelId,
      guestName,
      guestEmail: guestEmail || null,
      guestPhone: guestPhone || null,
      roomType,
      checkIn,
      checkOut,
      rooms: rooms || 1,
      status: status || "confirmed",
      agencyId: agencyId || null,
      totalCost: totalCost.toString(),
      dueBalance: (dueBalance || "0").toString(),
      notes: notes || null,
    })
    .returning();

  const booking = created[0];
  let agencyName = null;
  if (booking.agencyId) {
    const agencies = await db.select().from(agenciesTable).where(eq(agenciesTable.id, booking.agencyId));
    agencyName = agencies[0]?.name || null;
  }

  res.status(201).json({ ...booking, agencyName });
});

router.put("/:bookingId", authenticate, async (req: AuthRequest, res) => {
  const bookingId = parseInt(req.params.bookingId);
  const {
    guestName, guestEmail, guestPhone, roomType,
    checkIn, checkOut, rooms, status, agencyId,
    totalCost, dueBalance, notes
  } = req.body;

  const updates: Record<string, unknown> = {};
  if (guestName !== undefined) updates.guestName = guestName;
  if (guestEmail !== undefined) updates.guestEmail = guestEmail || null;
  if (guestPhone !== undefined) updates.guestPhone = guestPhone || null;
  if (roomType !== undefined) updates.roomType = roomType;
  if (checkIn !== undefined) updates.checkIn = checkIn;
  if (checkOut !== undefined) updates.checkOut = checkOut;
  if (rooms !== undefined) updates.rooms = rooms;
  if (status !== undefined) updates.status = status;
  if (agencyId !== undefined) updates.agencyId = agencyId || null;
  if (totalCost !== undefined) updates.totalCost = totalCost.toString();
  if (dueBalance !== undefined) updates.dueBalance = dueBalance.toString();
  if (notes !== undefined) updates.notes = notes || null;

  const updated = await db
    .update(bookingsTable)
    .set(updates)
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  const booking = updated[0];
  let agencyName = null;
  if (booking.agencyId) {
    const agencies = await db.select().from(agenciesTable).where(eq(agenciesTable.id, booking.agencyId));
    agencyName = agencies[0]?.name || null;
  }

  res.json({ ...booking, agencyName });
});

router.delete("/:bookingId", authenticate, async (req, res) => {
  const bookingId = parseInt(req.params.bookingId);
  await db.delete(bookingsTable).where(eq(bookingsTable.id, bookingId));
  res.json({ success: true, message: "Booking deleted" });
});

export default router;
