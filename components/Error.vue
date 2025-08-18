<template>
  <div
    v-if="error"
    class="relative w-2/5 mx-auto mt-6 flex flex-col items-center justify-center gap-2 z-50 p-4 text-white bg-red-600 rounded-lg shadow-md"
  >
    <p class="text-base">{{ error }}</p>
    <button
      @click="clearError"
      class="text-sm border border-white px-3 py-1 rounded hover:bg-white hover:text-red-600 transition"
    >
      Dismiss
    </button>
  </div>
</template>

<script setup>
import { useErrorStore } from '@/stores/error'

const { error, clearError } = useErrorStore()
</script>
