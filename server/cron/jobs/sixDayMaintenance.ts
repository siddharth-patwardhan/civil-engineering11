import { prisma, isDbConfigured } from "../../db.js";
import { writeAudit } from "../../auditLog.js";

export interface SixDayMaintenanceResult {
  purgedNotifications: number;
  approvalReminders: number;
  prunedAuditEvents: number;
}

const READ_NOTIFICATION_MAX_AGE_DAYS = 90;
const AUDIT_MAX_AGE_DAYS = 365;
const APPROVAL_REMINDER_STATES = ["SUBMITTED", "REVIEWED"] as const;

/**
 * Recurring maintenance for notifications, approvals, and audit retention.
 * Intended to run every 6 days via the server cron scheduler.
 */
export async function runSixDayMaintenance(): Promise<SixDayMaintenanceResult> {
  if (!isDbConfigured() || !prisma) {
    throw new Error("Database is not configured");
  }

  const result: SixDayMaintenanceResult = {
    purgedNotifications: 0,
    approvalReminders: 0,
    prunedAuditEvents: 0,
  };

  const notificationCutoff = new Date();
  notificationCutoff.setDate(notificationCutoff.getDate() - READ_NOTIFICATION_MAX_AGE_DAYS);

  const deleted = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: notificationCutoff },
    },
  });
  result.purgedNotifications = deleted.count;

  const auditCutoff = new Date();
  auditCutoff.setDate(auditCutoff.getDate() - AUDIT_MAX_AGE_DAYS);

  const pruned = await prisma.auditEvent.deleteMany({
    where: { createdAt: { lt: auditCutoff } },
  });
  result.prunedAuditEvents = pruned.count;

  const pendingApprovals = await prisma.approval.findMany({
    where: { state: { in: [...APPROVAL_REMINDER_STATES] } },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          members: {
            where: { role: { in: ["OWNER", "MANAGER"] } },
            select: { userId: true },
          },
        },
      },
    },
  });

  const reminderSince = new Date();
  reminderSince.setDate(reminderSince.getDate() - 6);

  for (const approval of pendingApprovals) {
    const recipients = approval.project.members.map((m) => m.userId);
    for (const userId of recipients) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          title: "Approval reminder",
          body: { contains: approval.entityId },
          createdAt: { gte: reminderSince },
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId,
          title: "Approval reminder",
          body: `${approval.project.name}: ${approval.entityType} (${approval.state}) is awaiting action. Ref: ${approval.entityId}`,
        },
      });
      result.approvalReminders += 1;
    }
  }

  await writeAudit(undefined, "cron.six_day_maintenance", "System", "cron", { ...result });

  return result;
}
