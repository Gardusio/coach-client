import { defineStore } from "pinia";
import { ref } from "vue";

export const useErrorStore = defineStore("error", () => {
  const error = ref(null);

  function setError(msg) {
    error.value = msg;
  }

  function clearError() {
    error.value = null;
  }

  return { error, setError, clearError };
});
