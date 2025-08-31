<template>
  <div class="flex w-screen h-screen">
    <!-- SIDEBAR -->
    <div
      class="flex flex-col bg-white border-r border-gray-200 overflow-y-auto w-1/4"
    >
      <div class="bg-gray-900 text-white p-4">
        <h2 class="text-lg font-semibold">Personal Coach</h2>
      </div>

      <div class="p-4">
        <button
          @click="handleSync"
          class="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 mb-2"
        >
          Sync Wearables
        </button>

        <button
          @click="handleNewChat"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-4"
        >
          New Chat
        </button>

        <ul class="space-y-1 overflow-y-auto">
          <li
            v-for="conversation in conversations"
            :key="conversation.id"
            @click="handleConversationSelect(conversation)"
            :class="[
              'px-4 py-2 rounded cursor-pointer flex justify-between items-center',
              isActive(conversation)
                ? 'bg-gray-100 font-semibold'
                : 'hover:bg-gray-100',
            ]"
          >
            <span class="truncate">{{ conversation.title }}</span>
            <button
              @click.stop="removeConversation(conversation.id)"
              class="text-gray-500 hover:text-red-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- MAIN CHAT AREA -->
    <div class="flex flex-col flex-1 h-full pb-8">
      <Error v-if="error" />
      <div v-else class="flex flex-col flex-1 min-h-0">
        <!-- Chat History -->
        <div class="flex-1 min-h-0 overflow-auto px-24 py-8">
          <div v-if="loading" class="flex justify-center items-center h-full">
            <div
              class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"
            />
          </div>
          <div v-else class="flex flex-col flex-1 overflow-auto min-h-0">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="mb-4"
              :class="msg.sender === 'user' ? 'text-right' : 'text-left'"
            >
              <div
                class="inline-block px-4 py-2 rounded-lg"
                :class="
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                "
              >
                {{ msg.content }}
              </div>
            </div>
            <p v-if="loadingResponse" class="text-sm text-gray-500 mt-2">
              Typing...
            </p>
            <div ref="bottomRef" />
          </div>
        </div>

        <!-- Chat Input -->
        <div
          class="flex items-center p-6 shadow-md rounded-lg w-4/5 mx-auto bg-white"
        >
          <input
            v-model="input"
            @keyup.enter.exact.prevent="handleSend"
            type="text"
            placeholder="Type a message..."
            class="flex-1 outline-none border-none bg-transparent text-base"
            :disabled="loadingResponse"
          />
          <button
            @click="handleSend"
            :disabled="loadingResponse"
            class="ml-4 w-12 h-12 rounded-full shadow-md flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1"
              stroke="currentColor"
              class="size-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUpdated, ref } from "vue";
import { storeToRefs } from "pinia";
import { useConversationStore } from "@/stores/conversation";
import { useErrorStore } from "@/stores/error";
import Error from "@/components/Error.vue";

const { $wearablesApi,  $chatApi  } = useNuxtApp();

// Store setup
const conversationStore = useConversationStore();
const errorStore = useErrorStore();

// Reactive state
const {
  conversations,
  activeConversation,
  messages,
  loading,
  loadingResponse,
} = storeToRefs(conversationStore);
const { error } = storeToRefs(errorStore);

// Actions
const {
  handleNewChat,
  handleConversationSelect,
  removeConversation,
  loadConversations,
  sendMessage,
} = conversationStore;
const { setError } = errorStore;

// Utility: current input text
const input = ref("");

// Scroll anchor
const bottomRef = ref(null);
const scrollToBottom = () => {
  if (bottomRef.value) {
    bottomRef.value.scrollIntoView({ behavior: "smooth" });
  }
};
onMounted(() => {
  loadConversations();
  scrollToBottom();
});
onUpdated(scrollToBottom);

// Send message handler
function handleSend() {
  const trimmed = input.value.trim();
  if (!trimmed) return;
  sendMessage(trimmed);
  input.value = "";
}

// Conversation selection active state
function isActive(conversation) {
  return activeConversation.value?.id === conversation.id;
}


// Sync wearables
async function handleSync() {
  try {
    const result = await $wearablesApi.syncWearables();
    alert(`Sync successful: ${result.rows_upserted} records`);
  } catch (err) {
    setError(err.message);
    alert(`Sync failed: ${err.message}`);
  }
}
</script>
