import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@classassist.ai" },
    update: {},
    create: {
      email: "admin@classassist.ai",
      password: hashed,
      name: "Admin",
      role: "ADMIN",
    },
  });

  const account = await prisma.account.upsert({
    where: { id: "demo-account-1" },
    update: {},
    create: {
      id: "demo-account-1",
      subscriptionTier: "PRO",
    },
  });

  const teacherPass = await bcrypt.hash("teacher123", 10);
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@classassist.ai" },
    update: {},
    create: {
      email: "teacher@classassist.ai",
      password: teacherPass,
      name: "Demo Teacher",
      role: "TEACHER",
      accountId: account.id,
    },
  });

  const managerPass = await bcrypt.hash("manager123", 10);
  await prisma.user.upsert({
    where: { email: "manager@classassist.ai" },
    update: {},
    create: {
      email: "manager@classassist.ai",
      password: managerPass,
      name: "Demo Manager",
      role: "MANAGER",
      accountId: account.id,
    },
  });

  await prisma.student.upsert({
    where: { id: "demo-student-1" },
    update: {},
    create: {
      id: "demo-student-1",
      accountId: account.id,
      name: "Alice",
      email: "alice@example.com",
    },
  });

  console.log("Seed done:", { admin: admin.email, teacher: teacher.email, account: account.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
