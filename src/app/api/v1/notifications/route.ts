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

const defaultNotifications: Omit<InAppNotification, "isRead">[] = [
  {
    id: "notif-loop-engine-2026",
    title: "⚡ Loop Engineering Activated",
    message: "Your prompts now compile through automated closed-loop refinement in <30ms with +40pt quality gain.",
    category: "optimization",
    createdAt: new Date().toISOString(),
    actionUrl: "/dashboard/new",
    actionLabel: "Try Studio",
  },
  {
    id: "notif-extension-v132",
    title: "🚀 Prompt+ Extension v1.3.2 Released",
    message: "Updated Chrome extension with 3-tier engine switcher (API, No-API, Gemini Nano) and context memory handoff.",
    category: "extension",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionUrl: "https://chromewebstore.google.com/detail/gdfaohfmmjjmpiggdcankjjihpljoccn",
    actionLabel: "View Extension",
  },
  {
    id: "notif-analytics-upgraded",
    title: "📊 Real-Time Analytics Live",
    message: "Inspect your prompt velocity, latency telemetry, and model distribution in the updated Analytics hub.",
    category: "system",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    actionUrl: "/dashboard/analytics",
    actionLabel: "View Analytics",
  },
  {
    id: "notif-welcome-free",
    title: "🎉 Welcome to Prompt+ Architect AI",
    message: "Free server-managed AI models are active. No API keys or credit cards required to optimize prompts.",
    category: "system",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    actionUrl: "/dashboard/settings",
    actionLabel: "Settings",
  },
];

export const GET = withAuth(
  async (_req, { userId, requestId }) => {
    const readSet = userReadNotificationsMap.get(userId) || new Set<string>();

    const notifications: InAppNotification[] = defaultNotifications.map((n) => ({
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
