// plugins/wearables.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? config.public.baseUrlProd
      : config.public.baseUrlDev;

  async function syncWearables(payload: any) {
    try {
      console.log("SYNCING AT", API_BASE_URL);
      const res = await fetch(`${API_BASE_URL}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err) {
      console.log("Sync failed", err);
    }
  }

  return {
    provide: {
      wearablesApi: {
        syncWearables,
      },
    },
  };
});
