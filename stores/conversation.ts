// stores/conversation.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { useErrorStore } from "@/stores/error";
import { useUserProfileStore } from "@/stores/userProfile";

export const useConversationStore = defineStore("conversation", () => {
  const { $chatApi } = useNuxtApp();

  const conversations = ref<any[]>([]);
  const errorStore = useErrorStore();
  const activeConversation = ref<any | null>(null);
  const messages = ref<any[]>([]);
  const loading = ref(false);
  const loadingResponse = ref(false);

  function getUserId(): string {
    const userProfileStore = useUserProfileStore();
    if (!userProfileStore.profile?.id) {
      throw new Error("User profile not set. Please enter a profile first.");
    }
    return userProfileStore.profile.id;
  }

  async function loadConversations() {
    loading.value = true;
    try {
      const userId = getUserId();
      const result = await $chatApi.getConversations(userId);
      conversations.value = result || [];
    } catch (err: any) {
      errorStore.setError(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(conversation: any) {
    if (!conversation) {
      messages.value = [];
      return;
    }
    loading.value = true;
    try {
      const data = await $chatApi.getConversationMessages(conversation);
      messages.value = data;
    } catch (err: any) {

      errorStore.setError(err);
    } finally {
      loading.value = false;
    }
  }

  function handleNewChat() {
    activeConversation.value = null;
    messages.value = [];
  }

  function handleConversationSelect(conversation: any) {
    activeConversation.value = conversation;
    fetchMessages(conversation);
  }

  async function sendMessage(input: string) {
    errorStore.clearError();
    loadingResponse.value = true;
    if (!input.trim()) return;

    const userId = getUserId();
    const conversationId = activeConversation.value?.id || null;

    const userMessage = {
      conversation_id: conversationId,
      user_id: userId,
      sender: "user",
      content: input,
    };

    messages.value.push(userMessage);

    try {
      const coachResponse = await $chatApi.sendNewMessage(
        userId,
        conversationId,
        input
      );
      messages.value?.push(coachResponse);
      loadingResponse.value = false;

      if (!activeConversation.value) {
        const newConversation = {
          id: coachResponse.conversation_id,
          user_id: coachResponse.user_id,
          app_id: coachResponse.app_id,
          title: userMessage.content.slice(0, 20) + "...",
        };
        activeConversation.value = newConversation;
        conversations.value?.push(newConversation);
      }
    } catch (err: any) {
      loadingResponse.value = false;
      errorStore.setError(err);
    }
  }

  async function removeConversation(conversationId: string) {
    errorStore.clearError();
    loading.value = true;
    try {
      const userId = getUserId();
      await $chatApi.deleteConversation(userId, conversationId);
      conversations.value = conversations.value.filter(
        (c) => c.id !== conversationId
      );
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null;
        messages.value = [];
      }
    } catch (err: any) {
      errorStore.setError(err);
    } finally {
      loading.value = false;
    }
  }

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    loadingResponse,
    loadConversations,
    fetchMessages,
    handleNewChat,
    handleConversationSelect,
    sendMessage,
    removeConversation,
  };
});
