CREATE TYPE "public"."user_role" AS ENUM('admin', 'hotel_owner', 'hotel_manager');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hotel_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"guest_name" text NOT NULL,
	"guest_email" text,
	"guest_phone" text,
	"room_type" text NOT NULL,
	"check_in" text NOT NULL,
	"check_out" text NOT NULL,
	"rooms" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"agency_id" integer,
	"total_cost" numeric(10, 2) NOT NULL,
	"due_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_rooms" integer NOT NULL,
	"plan_start_date" text NOT NULL,
	"plan_end_date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hotel_id" integer NOT NULL,
	"price_per_night" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" DEFAULT 'hotel_manager' NOT NULL,
	"hotel_id" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE no action ON UPDATE no action;