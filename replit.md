# Hotel CRM Workspace

## Overview

Full-stack Hotel CRM mobile app built with Expo React Native + Express API + PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + JWT Auth + bcryptjs
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Mobile**: Expo Router (file-based routing)

## Architecture

- `artifacts/hotel-crm/` — Expo React Native mobile app
- `artifacts/api-server/` — Express API with JWT auth
- `lib/db/` — Drizzle ORM schema + DB connection
- `lib/api-spec/` — OpenAPI spec + codegen config

## Roles

- **admin** — Manages all hotels, users, full CRUD on everything
- **hotel_owner** — Manages own hotel users, bookings, agencies
- **hotel_manager** — Views and manages bookings for their hotel

## Default Credentials

- Admin: `admin@hotelcrm.com` / `password`

## Key Features

- JWT authentication with plan expiry check
- Role-based access control (admin, hotel_owner, hotel_manager)
- Hotel management with plan start/end dates
- Booking management with date picker, agencies dropdown, status
- Agency and room type management per hotel
- Analytics with month/year/agency filters, occupancy progress bar
- 7-day booking forecast on dashboard
- Profile management with password change
- Keyboard-aware forms (input fields scroll up on focus)
- All currency in Indian Rupees (₹)
