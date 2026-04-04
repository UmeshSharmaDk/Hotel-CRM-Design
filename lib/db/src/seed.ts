import "dotenv/config";
import { db } from "./index.js";
import { usersTable } from "./schema/index.js";
import { eq } from "drizzle-orm";

async function seed() {
    console.log("Starting database seeding...");

    try {
        // 1. Check if the admin already exists to avoid duplicate constraint errors
        const existingAdmins = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, "admin@hotelcrm.com"));

        const passwordHash = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi";

        if (existingAdmins.length === 0) {
            // 2. Insert the admin user
            await db.insert(usersTable).values({
                name: "System Admin",
                email: "admin@hotelcrm.com",
                password: passwordHash,
                role: "admin",
            });

            console.log("Default admin created successfully:");
            console.log("   Email: admin@hotelcrm.com");
            console.log("   Password: password");
        } else {
            // Reset the default admin password if the existing hash does not match.
            if (existingAdmins[0].password !== passwordHash) {
                await db
                    .update(usersTable)
                    .set({ password: passwordHash })
                    .where(eq(usersTable.email, "admin@hotelcrm.com"));
                console.log("Default admin password was corrected to 'password'.");
            } else {
                console.log("Admin user already exists. Skipping insertion.");
            }
        }

        console.log("🌱 Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seed();