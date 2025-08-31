// plugins/wearables.client.ts
import Papa from "papaparse";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const PROFILE_PATH = "/morisio.json"; // still local static asset
  const WEARABLES_PATH = "/morisio.csv"; // still local static asset

  const APP_ID = "1";

  // Choose API base dynamically from env
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? config.public.baseUrlProd
      : config.public.baseUrlDev;

  async function syncWearables() {
    try {
      // Load local profile JSON
      const profileRes = await fetch(PROFILE_PATH);
      const rawProfile = await profileRes.json();

      const {
        gender,
        age,
        height,
        weight,
        conditions,
        preferences,
        dietary_restrictions,
        goals,
        blocks,
      } = rawProfile;

      const timestamp = new Date().toISOString();

      const profile = {
        gender,
        age,
        height,
        weight,
        conditions,
        preferences,
        dietary_restrictions,
        goals,
        blocks,
        timestamp,
      };

      // Load and parse wearables CSV
      const csvRes = await fetch(WEARABLES_PATH);
      const csvText = await csvRes.text();

      const parsed = Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      const biometricData = parsed.data.map((row: any) => {
        const { date, ...metrics } = row;
        const cleanedMetrics = Object.fromEntries(
          Object.entries(metrics)
            .filter(([_, v]) => v !== null && v !== "")
            .map(([k, v]) => [k, typeof v === "number" ? v : parseFloat(v)])
        );
        return { date, metrics: cleanedMetrics };
      });

      const payload = {
        user_id: rawProfile.id,
        app_id: APP_ID,
        profile,
        data: biometricData,
      };

      const res = await fetch(`${API_BASE_URL}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Sync failed");
      }

      return data;
    } catch (err) {
      console.error("Sync failed:", err);
      throw err;
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
