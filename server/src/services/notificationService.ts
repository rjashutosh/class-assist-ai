import { prisma } from "../lib/prisma.js";
export async function createMockNotification(
  accountId: string,
  type: string,
  recipient: string,
  message: string
): Promise<void> {
  await prisma.notification.create({
    data: {
      accountId,
      type,
      recipient,
      message,
      status: "PENDING",
    },
  });
}
