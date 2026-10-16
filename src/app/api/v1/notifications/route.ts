import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";
import { z } from "zod";

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  category: "system" | "optimization" | "extension" | "security";
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

// In-memory read state map for user sessions
const userReadNotificationsMap = new Map<string, Set<string>>();

// Every entry here was invented (fake releases, unmeasured "+40pt" gains) and served to all
// users. Keep this empty until notifications are derived from real events; the bell already
// renders an honest empty state.
const defaultNotifications: Omit<InAppNotification, "isRead">[] = [];

export const GET = withAuth(
  async (_req, { userId, requestId }) => {
    const readSet = userReadNotificationsMap.get(userId) || new Set<string>();
    const dismissedSet = userDismissedNotificationsMap.get(userId) || new Set<string>();

    const notifications: InAppNotification[] = defaultNotifications
      .filter((n) => !dismissedSet.has(n.id))
      .map((n) => ({
        ...n,
        isRead: readSet.has(n.id),
      }));

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return jsonResponse(
      {
        data: {
          notifications,
          unreadCount,
        },
      },
      { requestId }
    );
  }
);

const patchSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export const PATCH = withAuth(
  async (_req, { userId, requestId, body }) => {
    const { id, all } = body!;

    if (!userReadNotificationsMap.has(userId)) {
      userReadNotificationsMap.set(userId, new Set<string>());
    }
    const readSet = userReadNotificationsMap.get(userId)!;

    if (all) {
      defaultNotifications.forEach((n) => readSet.add(n.id));
    } else if (id) {
      readSet.add(id);
    }

    return jsonResponse(
      {
        data: {
          success: true,
          readCount: readSet.size,
        },
      },
      { requestId }
    );
  },
  { schema: patchSchema }
);

// Dismissed notifications map per user
const userDismissedNotificationsMap = new Map<string, Set<string>>();

export const DELETE = withAuth(
  async (req, { userId, requestId }) => {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const clearAll = url.searchParams.get("all") === "true";

    if (!userDismissedNotificationsMap.has(userId)) {
      userDismissedNotificationsMap.set(userId, new Set<string>());
    }
    const dismissedSet = userDismissedNotificationsMap.get(userId)!;

    if (clearAll) {
      defaultNotifications.forEach((n) => dismissedSet.add(n.id));
    } else if (id) {
      dismissedSet.add(id);
    }

    return jsonResponse(
      {
        data: {
          success: true,
          dismissedCount: dismissedSet.size,
        },
      },
      { requestId }
    );
  }
);
