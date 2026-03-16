import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, hotelsTable, agenciesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { authenticate, AuthRequest } from "../lib/auth.js";

const router = Router({ mergeParams: true });

router.get("/analytics", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);
  const month = req.query.month ? parseInt(req.query.month as string) : null;
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
  const agencyId = req.query.agencyId ? parseInt(req.query.agencyId as string) : null;

  const hotels = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  const hotel = hotels[0];
  if (!hotel) {
    res.status(404).json({ message: "Hotel not found" });
    return;
  }

  let bookings = await db
    .select({
      id: bookingsTable.id,
      checkIn: bookingsTable.checkIn,
      checkOut: bookingsTable.checkOut,
      rooms: bookingsTable.rooms,
      status: bookingsTable.status,
      agencyId: bookingsTable.agencyId,
      agencyName: agenciesTable.name,
      totalCost: bookingsTable.totalCost,
    })
    .from(bookingsTable)
    .leftJoin(agenciesTable, eq(bookingsTable.agencyId, agenciesTable.id))
    .where(eq(bookingsTable.hotelId, hotelId));

  if (agencyId) {
    bookings = bookings.filter((b) => b.agencyId === agencyId);
  }

  const targetYear = year;
  const targetMonth = month;

  const monthlyBookings = bookings.filter((b) => {
    const checkIn = new Date(b.checkIn);
    if (targetMonth) {
      return checkIn.getFullYear() === targetYear && checkIn.getMonth() + 1 === targetMonth;
    }
    return checkIn.getFullYear() === targetYear;
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.totalCost || "0"), 0);
  const monthlyRevenue = monthlyBookings.reduce((sum, b) => sum + parseFloat(b.totalCost || "0"), 0);

  const today = new Date().toISOString().split("T")[0];
  const activeBookings = bookings.filter((b) => b.checkIn <= today && b.checkOut >= today);
  const occupiedRooms = activeBookings.reduce((sum, b) => sum + (b.rooms || 1), 0);
  const occupancyRate = hotel.totalRooms > 0 ? (occupiedRooms / hotel.totalRooms) * 100 : 0;

  const avgStayDuration = monthlyBookings.length > 0
    ? monthlyBookings.reduce((sum, b) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0) / monthlyBookings.length
    : 0;

  const bookingsByStatus: Record<string, number> = {};
  bookings.forEach((b) => {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] || 0) + 1;
  });

  const agencyMap: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const name = b.agencyName || "Direct";
    if (!agencyMap[name]) agencyMap[name] = { count: 0, revenue: 0 };
    agencyMap[name].count++;
    agencyMap[name].revenue += parseFloat(b.totalCost || "0");
  });

  const bookingsByAgency = Object.entries(agencyMap).map(([agencyName, data]) => ({
    agencyName,
    count: data.count,
    revenue: data.revenue,
  }));

  res.json({
    totalBookings: bookings.length,
    totalRevenue,
    monthlyRevenue,
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    avgStayDuration: Math.round(avgStayDuration * 10) / 10,
    bookingsByStatus,
    bookingsByAgency,
  });
});

router.get("/forecast", authenticate, async (req: AuthRequest, res) => {
  const hotelId = parseInt(req.params.hotelId);

  const hotels = await db.select().from(hotelsTable).where(eq(hotelsTable.id, hotelId));
  const hotel = hotels[0];
  if (!hotel) {
    res.status(404).json({ message: "Hotel not found" });
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6);
  const endStr = endDate.toISOString().split("T")[0];

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.hotelId, hotelId),
        gte(bookingsTable.checkOut, todayStr),
        lte(bookingsTable.checkIn, endStr)
      )
    );

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const checkIns = bookings.filter((b) => b.checkIn === dateStr).length;
    const checkOuts = bookings.filter((b) => b.checkOut === dateStr).length;
    const occupied = bookings
      .filter((b) => b.checkIn <= dateStr && b.checkOut > dateStr)
      .reduce((sum, b) => sum + (b.rooms || 1), 0);

    days.push({ date: dateStr, checkIns, checkOuts, occupied });
  }

  const todayOccupied = days[0].occupied;
  const occupancyRate = hotel.totalRooms > 0 ? (todayOccupied / hotel.totalRooms) * 100 : 0;

  res.json({
    todayOccupancy: Math.round(occupancyRate * 10) / 10,
    totalRooms: hotel.totalRooms,
    occupiedRooms: todayOccupied,
    days,
  });
});

export default router;
