import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL. Add it to .env.local before seeding admin.");
}

const adminEmail = process.env.ADMIN_EMAIL || "admin@thanhtrung.local";
const adminPassword = process.env.ADMIN_PASSWORD || "123456";
const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl)
});

const passwordHash = await bcrypt.hash(adminPassword, 12);

await prisma.user.upsert({
  create: {
    email: adminEmail,
    name: "Admin",
    passwordHash,
    phone: "0000000000",
    role: "ADMIN"
  },
  update: {
    name: "Admin",
    passwordHash,
    role: "ADMIN"
  },
  where: {
    email: adminEmail
  }
});

await prisma.$disconnect();

console.log(`Admin ready: admin / ${adminPassword} (${adminEmail})`);
