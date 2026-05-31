import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL. Add the Supabase pooled connection string before seeding admin.");
}

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  throw new Error("Missing ADMIN_EMAIL or ADMIN_PASSWORD. Add them to your local environment before seeding admin.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl)
});

const passwordHash = await bcrypt.hash(adminPassword, 12);

await prisma.user.upsert({
  create: {
    email: adminEmail,
    name: "Admin",
    passwordHash,
    phone: null,
    role: "ADMIN"
  },
  update: {
    name: "Admin",
    passwordHash,
    phone: null,
    role: "ADMIN"
  },
  where: {
    email: adminEmail
  }
});

await prisma.$disconnect();

console.log(`Admin ready: ${adminEmail}`);
