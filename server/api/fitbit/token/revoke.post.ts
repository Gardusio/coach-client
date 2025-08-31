// server/api/fitbit/token/revoke.post.ts
import { defineEventHandler } from "h3";
import { getSessionId, tokensKey, metaKey } from "../../utils/session";
import { revokeToken } from "../../utils/fitbit";

export default defineEventHandler(async (event) => {
  const sid = await getSessionId(event);
  const storage = useStorage();
  const cfg = useRuntimeConfig();
  const clientId = cfg.public.fitbitClientId;
  const appType = cfg.public.fitbitAppType;
  const clientSecret =
    appType === "server" && cfg.fitbitClientSecret
      ? cfg.fitbitClientSecret
      : undefined;

  const tokens = await storage.getItem<any>(tokensKey(sid));
  if (tokens?.refresh_token) {
    await revokeToken({ clientId, clientSecret, token: tokens.refresh_token });
  }
  await storage.removeItem(tokensKey(sid));
  await storage.removeItem(metaKey(sid));
  return { ok: true };
});
