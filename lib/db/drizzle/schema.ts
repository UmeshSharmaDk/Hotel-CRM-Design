import { pgTable, foreignKey, serial, text, integer, numeric, timestamp, unique, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userRole = pgEnum("user_role", ['admin', 'hotel_owner', 'hotel_manager'])


export const roomTypes = pgTable("room_types", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	hotelId: integer("hotel_id").notNull(),
	pricePerNight: numeric("price_per_night", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.hotelId],
			foreignColumns: [hotels.id],
			name: "room_types_hotel_id_hotels_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	role: userRole().default('hotel_manager').notNull(),
	hotelId: integer("hotel_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.hotelId],
			foreignColumns: [hotels.id],
			name: "users_hotel_id_hotels_id_fk"
		}),
	unique("users_email_unique").on(table.email),
]);

export const hotels = pgTable("hotels", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	totalRooms: integer("total_rooms").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	planStartDate: text("plan_start_date").notNull(),
	planEndDate: text("plan_end_date").notNull(),
});

export const agencies = pgTable("agencies", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	hotelId: integer("hotel_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.hotelId],
			foreignColumns: [hotels.id],
			name: "agencies_hotel_id_hotels_id_fk"
		}),
]);

export const bookings = pgTable("bookings", {
	id: serial().primaryKey().notNull(),
	hotelId: integer("hotel_id").notNull(),
	agencyId: integer("agency_id"),
	guestName: text("guest_name").notNull(),
	checkIn: text("check_in").notNull(),
	checkOut: text("check_out").notNull(),
	totalCost: numeric("total_cost", { precision: 10, scale:  2 }).notNull(),
	status: text().default('confirmed').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	guestEmail: text("guest_email"),
	guestPhone: text("guest_phone"),
	roomType: text("room_type").notNull(),
	rooms: integer().default(1).notNull(),
	dueBalance: numeric("due_balance", { precision: 10, scale:  2 }).default('0').notNull(),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.hotelId],
			foreignColumns: [hotels.id],
			name: "bookings_hotel_id_hotels_id_fk"
		}),
	foreignKey({
			columns: [table.agencyId],
			foreignColumns: [agencies.id],
			name: "bookings_agency_id_agencies_id_fk"
		}),
]);
