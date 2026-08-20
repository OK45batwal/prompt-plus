import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock next-auth
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test-user-123" } }),
}));

import { GET as getNotifications, PATCH as patchNotifications, DELETE as deleteNotifications } from "@/app/api/v1/notifications/route";

describe("In-App Notification Center API", () => {
  it("should return notifications list and unread count for authenticated user", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/notifications");
    const res = await getNotifications(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.notifications.length).toBeGreaterThan(0);
    expect(typeof json.data.unreadCount).toBe("number");
  });

  it("should mark notifications as read via PATCH", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });

    const res = await patchNotifications(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.success).toBe(true);
  });

  it("should dismiss notifications via DELETE", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/notifications?id=notif-loop-engine-2026", {
      method: "DELETE",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const res = await deleteNotifications(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.success).toBe(true);
  });
});
