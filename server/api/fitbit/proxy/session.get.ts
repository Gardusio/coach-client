// server/api/fitbit/session.get.ts
import { defineEventHandler } from "h3";
import { getSessionId, metaKey, tokensKey } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const sid = await getSessionId(event);
  const storage = useStorage();
  const meta = await storage.getItem<any>(metaKey(sid));
  const tokens = await storage.getItem<any>(tokensKey(sid));
  const active = Boolean(tokens?.access_token);
  return {
    active,
    userId: meta?.user_id ?? null,
    scope: meta?.scope ?? [],
    expiresAt: meta?.expires_at ?? null,
  };
});
