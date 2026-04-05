import { mysqlTable, serial, text, int, decimal, timestamp, boolean, mysqlEnum } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: mysqlEnum("role", ["admin", "hotel_owner", "hotel_manager"]).notNull().default("hotel_manager"),
  hotelId: int("hotel_id").references(() => hotelsTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotelsTable = mysqlTable("hotels", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  totalRooms: int("total_rooms").notNull(),
  planStartDate: text("plan_start_date").notNull(),
  planEndDate: text("plan_end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agenciesTable = mysqlTable("agencies", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  hotelId: int("hotel_id").notNull().references(() => hotelsTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomTypesTable = mysqlTable("room_types", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  hotelId: int("hotel_id").notNull().references(() => hotelsTable.id),
  pricePerNight: decimal("price_per_night", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingsTable = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  hotelId: int("hotel_id").notNull().references(() => hotelsTable.id),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email"),
  guestPhone: text("guest_phone"),
  roomType: text("room_type").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  rooms: int("rooms").notNull().default(1),
  status: text("status").notNull().default("confirmed"),
  agencyId: int("agency_id").references(() => agenciesTable.id),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  dueBalance: decimal("due_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHotelSchema = createInsertSchema(hotelsTable).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertAgencySchema = createInsertSchema(agenciesTable).omit({ id: true, createdAt: true });
export const insertRoomTypeSchema = createInsertSchema(roomTypesTable).omit({ id: true, createdAt: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });

export type Hotel = typeof hotelsTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type Agency = typeof agenciesTable.$inferSelect;
export type RoomType = typeof roomTypesTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAgency = z.infer<typeof insertAgencySchema>;
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
