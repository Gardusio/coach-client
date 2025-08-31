// stores/error.ts
import { defineStore } from "pinia";
import { ref } from "vue";

function normalizeError(err): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export const useErrorStore = defineStore("error", () => {
  const error = ref(null);

  function setError(err: unknown) {
    error.value = normalizeError(err);
  }

  function clearError() {
    error.value = null;
  }

  return { error, setError, clearError };
});
