<script setup lang="ts">
import { useFitbitAuth } from "~/composables/useFitbitAuth";
import { useFitbitAuthStore } from "~/stores/fitbitAuth";

const { beginAuth } = useFitbitAuth();

const store = useFitbitAuthStore();
const {
  fetchLastThreeMonths
} = useFitbitMetrics();

const y = ref({});
onMounted(() => store.hydrateSession());

const fetchIt = async () => {
  const rows = await fetchLastThreeMonths();
  y.value = rows
};

// y is a flat object with all requested fields (null where not available)
</script>

<template>
  <div class="p-8">
    <div v-if="!store.isAuthorized">
      <button @click="beginAuth()" class="px-4 py-2 border rounded">
        Connect Fitbit
      </button>
    </div>
    <div v-else>
      <p>Connected as: {{ store.userId }}</p>
      <button @click="fetchIt">Fetch</button>

      <pre>{{ y }}</pre>
    </div>
  </div>
</template>
