<script setup lang="ts">
import { useFitbitAuth } from '~/composables/useFitbitAuth'

const { handleCallback } = useFitbitAuth()
const router = useRouter()

onMounted(async () => {
  await handleCallback()
  router.replace('/connect')
})
</script>

<template>
  <p>Completing Fitbit authorization…</p>
</template>
