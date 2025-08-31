// plugins/wearables.client.ts
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? config.public.baseUrlProd
      : config.public.baseUrlDev;

  async function syncWearables(payload: any) {
    const res = await fetch(`${API_BASE_URL}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Sync failed");
    }

    return data;
  }

  return {
    provide: {
      wearablesApi: {
        syncWearables,
      },
    },
  };
});
