import { relations } from "drizzle-orm/relations";
import { hotels, roomTypes, users, agencies, bookings } from "./schema";

export const roomTypesRelations = relations(roomTypes, ({one}) => ({
	hotel: one(hotels, {
		fields: [roomTypes.hotelId],
		references: [hotels.id]
	}),
}));

export const hotelsRelations = relations(hotels, ({many}) => ({
	roomTypes: many(roomTypes),
	users: many(users),
	agencies: many(agencies),
	bookings: many(bookings),
}));

export const usersRelations = relations(users, ({one}) => ({
	hotel: one(hotels, {
		fields: [users.hotelId],
		references: [hotels.id]
	}),
}));

export const agenciesRelations = relations(agencies, ({one, many}) => ({
	hotel: one(hotels, {
		fields: [agencies.hotelId],
		references: [hotels.id]
	}),
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({one}) => ({
	hotel: one(hotels, {
		fields: [bookings.hotelId],
		references: [hotels.id]
	}),
	agency: one(agencies, {
		fields: [bookings.agencyId],
		references: [agencies.id]
	}),
}));