import Papa from "papaparse";

const PROFILE_PATH = "/morisio.json";
const WEARABLES_PATH = "/morisio.csv";
const APP_ID = "1";
const API_BASE_URL =
  "https://coach-platform-fast-production.up.railway.app:8080/api";

export async function syncWearables() {
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

    console.log(csvText);

    const parsed = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    console.log(parsed);

    const biometricData = parsed.data.map((row) => {
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

    // Send data to backend
    const res = await fetch(`${API_BASE_URL}/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(JSON.stringify(payload));

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Sync failed");
    }

    console.log("Sync successful:", data);
    return data;
  } catch (err) {
    console.error("Sync failed:", err);
    throw err;
  }
}
