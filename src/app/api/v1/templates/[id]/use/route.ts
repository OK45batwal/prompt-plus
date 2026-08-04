import { getDb } from "@/lib/db/prisma";
import { checkIpRateLimit, extractClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { withAuth } from "@/lib/api/with-auth";
import { jsonResponse } from "@/lib/api/response-headers";

export const POST = withAuth(async (request, { requestId }) => {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const useIdx = parts.indexOf("use");
  const templateId = useIdx > 0 ? parts[useIdx - 1] : "";
  const ip = extractClientIp(request);

  const rateCheck = checkIpRateLimit(`tpluse:${ip}`, 60, 60 * 60 * 1000);
  const rateLimitHeaders = getRateLimitHeaders(rateCheck);

  if (!rateCheck.allowed) {
    return jsonResponse(
      { error: "Too many requests from this address. Try again later." },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)) }, requestId }
    );
  }

  try {
    const template = await getDb().template.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    return jsonResponse(
      { data: { id: template.id, usageCount: template.usageCount } },
      { headers: rateLimitHeaders, requestId }
    );
  } catch {
    return jsonResponse({ error: "Template not found" }, { status: 404, headers: rateLimitHeaders, requestId });
  }
});
