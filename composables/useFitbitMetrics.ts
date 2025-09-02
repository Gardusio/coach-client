// composables/useFitbitMetrics.ts
import { $fetch } from "ofetch";

export interface DailyMetrics {
  date: string;
  lightly_active_minutes: number | null;
  moderately_active_minutes: number | null;
  very_active_minutes: number | null;
  cardio_minutes: number | null;
  fat_burn_minutes: number | null;
  peak_minutes: number | null;
  sedentary_minutes: number | null;
  steps: number | null;
  distance: number | null;
  floors: number | null;
  calories: number | null;
  minutes_in_default_zone_1: number | null;
  minutes_below_default_zone_1: number | null;
  minutes_in_default_zone_2: number | null;
  minutes_in_default_zone_3: number | null;
  bpm: number | null;
  resting_hr: number | null;
  rmssd: number | null;
  filteredDemographicVO2Max: number | null;
  sleep_duration: number | null;
  timeInBed: number | null;
  light_sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  wake_sleep_count: number | null;
  full_sleep_breathing_rate: number | null;
  sleep_score: number | null;
  stress_score: number | null;
}

async function get<T = any>(path: string) {
  return $fetch<T>(`/api/fitbit/proxy/${path}`);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function splitIntoBatches(
  start: Date,
  end: Date,
  maxDays = 30
): Array<[string, string]> {
  const batches: Array<[string, string]> = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const batchStart = new Date(cursor);
    const batchEnd = new Date(cursor);
    batchEnd.setUTCDate(batchEnd.getUTCDate() + maxDays - 1);
    if (batchEnd > end) batchEnd.setTime(end.getTime());
    batches.push([ymd(batchStart), ymd(batchEnd)]);
    cursor.setUTCDate(cursor.getUTCDate() + maxDays);
  }
  return batches;
}

function clamp(min: number, max: number, v: number) {
  return Math.min(max, Math.max(min, v));
}

function normalize(val: number, min: number, max: number): number {
  if (val == null || isNaN(val)) return 0;
  return (val - min) / (max - min);
}

/**
 * Stress / recovery score:
 *  - 100 = recovered / free of stress
 *  - 50 = high stress
 */
function computeStress(
  restingHr: number | null,
  rmssd: number | null,
  sleepScore: number | null,
  activityMinutes: number | null
): number | null {
  if (restingHr == null && rmssd == null && sleepScore == null) return null;

  // Normalizations
  const hrNorm = restingHr != null ? normalize(restingHr, 50, 90) : 0; // higher HR = worse
  const hrvNorm = rmssd != null ? normalize(rmssd, 20, 100) : 0; // higher HRV = better
  const sleepNorm = sleepScore != null ? normalize(sleepScore, 50, 100) : 0; // efficiency
  const actNorm =
    activityMinutes != null ? normalize(activityMinutes, 0, 120) : 0;

  // Weights
  const wHR = -30; // resting HR pulls down
  const wHRV = +30; // HRV pulls up
  const wSleep = +25; // sleep efficiency pulls up
  const wAct = +15; // activity mitigates stress slightly

  let score = 75;
  score += wHRV * hrvNorm;
  score += wHR * hrNorm;
  score += wSleep * sleepNorm;
  score += wAct * actNorm;

  return clamp(50, 100, score) - 10;
}

function safe<T>(res: PromiseSettledResult<T>): T | null {
  return res.status === "fulfilled" ? res.value : null;
}

export function useFitbitMetrics() {
  async function fetchLastThreeMonths(): Promise<DailyMetrics[]> {
    const end = new Date();
    const start = new Date();
    start.setUTCMonth(end.getUTCMonth() - 1); // full 3 months

    const batches = splitIntoBatches(start, end, 30);
    const map: Record<string, DailyMetrics> = {};

    function ensure(d: string) {
      if (!map[d]) {
        map[d] = {
          date: d,
          lightly_active_minutes: null,
          moderately_active_minutes: null,
          very_active_minutes: null,
          cardio_minutes: null,
          fat_burn_minutes: null,
          peak_minutes: null,
          sedentary_minutes: null,
          steps: null,
          distance: null,
          floors: null,
          calories: null,
          minutes_in_default_zone_1: null,
          minutes_below_default_zone_1: null,
          minutes_in_default_zone_2: null,
          minutes_in_default_zone_3: null,
          bpm: null,
          resting_hr: null,
          rmssd: null,
          filteredDemographicVO2Max: null,
          sleep_duration: null,
          timeInBed: null,
          light_sleep_minutes: null,
          deep_sleep_minutes: null,
          rem_sleep_minutes: null,
          wake_sleep_count: null,
          full_sleep_breathing_rate: null,
          sleep_score: null,
          stress_score: null,
        };
      }
      return map[d];
    }

    for (const [startYmd, endYmd] of batches) {
      const [
        steps,
        dist,
        floors,
        cals,
        sedentary,
        lightAct,
        modAct,
        veryAct,
        hr,
        hrv,
        sleep,
        br,
        cardio,
      ] = await Promise.allSettled([
        get<any>(`1/user/-/activities/steps/date/${startYmd}/${endYmd}.json`),
        get<any>(
          `1/user/-/activities/distance/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(`1/user/-/activities/floors/date/${startYmd}/${endYmd}.json`),
        get<any>(
          `1/user/-/activities/calories/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(
          `1/user/-/activities/minutesSedentary/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(
          `1/user/-/activities/minutesLightlyActive/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(
          `1/user/-/activities/minutesFairlyActive/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(
          `1/user/-/activities/minutesVeryActive/date/${startYmd}/${endYmd}.json`
        ),
        get<any>(`1/user/-/activities/heart/date/${startYmd}/${endYmd}.json`),
        get<any>(`1/user/-/hrv/date/${startYmd}/${endYmd}.json`),
        get<any>(`1.2/user/-/sleep/date/${startYmd}/${endYmd}.json`),
        get<any>(`1/user/-/br/date/${startYmd}/${endYmd}.json`),
        get<any>(`1/user/-/cardioscore/date/${startYmd}/${endYmd}.json`),
      ]);

      const stepsData = safe(steps);
      const distData = safe(dist);
      const floorsData = safe(floors);
      const calsData = safe(cals);
      const sedentaryData = safe(sedentary);
      const lightActData = safe(lightAct);
      const modActData = safe(modAct);
      const veryActData = safe(veryAct);
      const hrData = safe(hr);
      const hrvData = safe(hrv);
      const sleepData = safe(sleep);
      const brData = safe(br);
      const cardioData = safe(cardio);

      function assign(
        dataset: any[] | undefined,
        field: keyof DailyMetrics,
        accessor: (v: any) => number
      ) {
        if (!dataset) return;
        for (const row of dataset) {
          const d = row.dateTime;
          if (!d) continue;
          const val = accessor(row);
          if (val != null) ensure(d)[field] = val;
        }
      }

      assign(stepsData?.["activities-steps"], "steps", (r) => Number(r.value));
      assign(distData?.["activities-distance"], "distance", (r) =>
        Number(r.value)
      );
      assign(floorsData?.["activities-floors"], "floors", (r) =>
        Number(r.value)
      );
      assign(calsData?.["activities-calories"], "calories", (r) =>
        Number(r.value)
      );
      assign(
        sedentaryData?.["activities-minutesSedentary"],
        "sedentary_minutes",
        (r) => Number(r.value)
      );
      assign(
        lightActData?.["activities-minutesLightlyActive"],
        "lightly_active_minutes",
        (r) => Number(r.value)
      );
      assign(
        modActData?.["activities-minutesFairlyActive"],
        "moderately_active_minutes",
        (r) => Number(r.value)
      );
      assign(
        veryActData?.["activities-minutesVeryActive"],
        "very_active_minutes",
        (r) => Number(r.value)
      );

      if (hrData?.["activities-heart"]) {
        for (const row of hrData["activities-heart"]) {
          const d = row.dateTime;
          if (!d) continue;
          const entry = ensure(d);
          const val = row.value?.restingHeartRate;
          if (typeof val === "number") entry.resting_hr = val;

          if (Array.isArray(row.value?.heartRateZones)) {
            for (const z of row.value.heartRateZones) {
              const name = (z.name || "").toLowerCase();
              const min = typeof z.minutes === "number" ? z.minutes : null;
              if (min == null) continue;
              if (name.includes("fat")) entry.fat_burn_minutes = min;
              else if (name.includes("cardio")) entry.cardio_minutes = min;
              else if (name.includes("peak")) entry.peak_minutes = min;
              else if (name.includes("out"))
                entry.minutes_below_default_zone_1 = min;
            }
          }

          entry.minutes_in_default_zone_1 = entry.fat_burn_minutes;
          entry.minutes_in_default_zone_2 = entry.cardio_minutes;
          entry.minutes_in_default_zone_3 = entry.peak_minutes;
        }
      }

      if (hrvData?.hrv) {
        for (const row of hrvData.hrv) {
          const d = row.dateTime;
          if (!d) continue;
          const val = row.value?.dailyRmssd;
          if (typeof val === "number") ensure(d).rmssd = val;
        }
      }

      if (sleepData?.sleep) {
        for (const s of sleepData.sleep) {
          const d = s.dateOfSleep;
          if (!d) continue;
          const e = ensure(d);
          e.sleep_duration = s.duration ?? null;
          e.timeInBed = s.timeInBed ?? null;
          e.sleep_score = s.efficiency ?? null;
          if (s.levels?.summary) {
            e.light_sleep_minutes = s.levels.summary.light?.minutes ?? null;
            e.deep_sleep_minutes = s.levels.summary.deep?.minutes ?? null;
            e.rem_sleep_minutes = s.levels.summary.rem?.minutes ?? null;
            e.wake_sleep_count = s.levels.summary.wake?.count ?? null;
          }
        }
      }

      if (brData?.br) {
        for (const row of brData.br) {
          const d = row.dateTime;
          if (!d) continue;
          const val = row.value?.breathingRate;
          if (typeof val === "number")
            ensure(d).full_sleep_breathing_rate = val;
        }
      }

      if (cardioData?.cardioScore) {
        for (const row of cardioData.cardioScore) {
          const d = row.dateTime;
          if (!d) continue;
          const raw = row.value?.vo2Max;
          if (typeof raw === "string") {
            let val: number | null = null;
            if (/^\d+(\.\d+)?$/.test(raw)) {
              val = parseFloat(raw);
            } else if (/^\d+-\d+$/.test(raw)) {
              const [lo, hi] = raw.split("-").map(Number);
              val = (lo + hi) / 2;
            }
            if (val != null) ensure(d).filteredDemographicVO2Max = val;
          }
        }
      }
    }

    // Post-process: compute stress for all days
    for (const entry of Object.values(map)) {
      const totalActivity =
        (entry.moderately_active_minutes ?? 0) +
        (entry.very_active_minutes ?? 0) +
        (entry.cardio_minutes ?? 0) +
        (entry.peak_minutes ?? 0);

      entry.stress_score = computeStress(
        entry.resting_hr,
        entry.rmssd,
        entry.sleep_score,
        totalActivity
      );
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }

  return { fetchLastThreeMonths };
}
