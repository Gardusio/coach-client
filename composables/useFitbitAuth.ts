// composables/useFitbitAuth.ts
const PKCE_VERIFIER_KEY = "fitbit:pkce_verifier";
const OAUTH_STATE_KEY = "fitbit:oauth_state";

async function generatePkce(): Promise<{
  verifier: string;
  challenge: string;
}> {
  return {
    verifier:
      "6u4z5a3t645t213k3h6x3k702v64261o2x5q3k441p3d0m2h5j2g605o641g6p0b0c54010p1g00500s5i635q4k1t6j084a4p2m185u6v5f464421670f5c6y6e6r5q",
    challenge: "jSRK39xg1BBuh9ZDEJPe9Tz-x-UVvl5N9n-7g0v-o0I",
  };
}

function randomState() {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(arr)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

export function useFitbitAuth() {
  const router = useRouter();
  const route = useRoute();
  const config = useRuntimeConfig();
  const publicCfg = config.public;
  const store = useFitbitAuthStore();

  async function beginAuth(scopes?: string) {
    const { challenge, verifier } = await generatePkce();
    sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);

    const state = randomState();
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    console.log("PUBLIC FITBIT CONFIG", publicCfg)

    // Fitbit authorization endpoint + PKCE (S256). Redirect URI must be registered.
    // Required params per Fitbit: client_id, scope, code_challenge, code_challenge_method, response_type=code.
    // We also pass redirect_uri and state.
    const url = new URL("https://www.fitbit.com/oauth2/authorize");
    url.searchParams.set("client_id", publicCfg.fitbitClientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("scope", (scopes ?? publicCfg.fitbitScopes).trim());
    url.searchParams.set("redirect_uri", publicCfg.fitbitRedirectUri);
    url.searchParams.set("state", state);

    window.location.assign(url.toString());
  }

  // Call this from your /auth/fitbit/callback page
  async function handleCallback() {
    const code = route.query.code as string | undefined;
    const state = route.query.state as string | undefined;
    if (!code) return;

    const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    if (expectedState && state && expectedState !== state) {
      throw new Error("OAuth state mismatch");
    }

    const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    if (!codeVerifier) throw new Error("Missing PKCE verifier");

    // Exchange happens server-side to avoid CORS and keep secrets/tokens off the browser.
    const result = await $fetch("/api/fitbit/token/exchange", {
      method: "POST",
      body: {
        code,
        codeVerifier,
        redirectUri: publicCfg.fitbitRedirectUri,
      },
    });

    // Tokens are stored server-side. We only hydrate minimal session metadata.
    await store.hydrateSession();

    return result;
  }

  async function disconnect() {
    await $fetch("/api/fitbit/token/revoke", { method: "POST" });
    store.clear();
    await router.push("/");
  }

  return { beginAuth, handleCallback, disconnect };
}
