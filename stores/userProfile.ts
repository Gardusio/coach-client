// stores/userProfile.ts
import { defineStore } from "pinia";

export interface UserProfile {
  id: string;
  username: string;
  gender: string;
  age: number;
  bmi: number;
  height: number;
  weight: number;
  conditions: string[];
  preferences: string[];
  dietary_restrictions: string[];
  goals: string[];
  blocks: string[];
  [key: string]: any; // allow extra keys
}

const STORAGE_KEY = "userProfile";

export const useUserProfileStore = defineStore("userProfile", {
  state: (): { profile: UserProfile | null } => ({
    profile: {
      id: "morisio",
      username: "morisio",
      gender: "MALE",
      age: 64,
      bmi: 23.4,
      height: 180,
      weight: 76,
      conditions: [],
      preferences: ["running", "cycling"],
      dietary_restrictions: [],
      goals: ["longevity"],
      blocks: [],
    },
  }),
  actions: {
    setProfile(profile: UserProfile) {
      this.profile = profile;
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }
    },
    clearProfile() {
      this.profile = null;
      if (import.meta.client) {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    hydrate() {
      if (import.meta.client) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            this.profile = JSON.parse(raw);
          } catch {
            this.profile = null;
          }
        }
      }
    },
  },
  getters: {
    isSet: (state) => !!state.profile,
  },
});
