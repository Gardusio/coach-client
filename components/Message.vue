<template>
  <div
    class="flex flex-col my-1"
    :class="{
      'items-start': sender === 'coach',
      'items-end': sender === 'user',
    }"
  >
    <div
      :class="[
        'p-3 rounded-lg text-gray-900',
        sender === 'coach' ? 'bg-white max-w-full' : 'bg-gray-100 max-w-[60%]',
      ]"
    >
      <p v-html="marked(content)" class="prose prose-sm max-w-none"></p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import { marked } from "marked";

defineProps({
  sender: {
    type: String,
    required: true,
    validator: (val) => ["user", "coach"].includes(val),
  },
  content: {
    type: String,
    required: true,
  },
});
</script>
