import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getConversations,
  getConversationMessages,
  sendNewMessage,
  deleteConversation,
} from "@/api/chat";

const MORISIO = "morisio"; // fixed user
export const useConversationStore = defineStore("conversation", () => {
  const conversations = ref([]);
  const activeConversation = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const loadingResponse = ref(false);

  async function loadConversations() {
    loading.value = true;
    try {
      const result = await getConversations(MORISIO); // fixed user
      conversations.value = result;
    } catch (err) {
      useErrorStore().setError(err.message);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMessages(conversation) {
    if (!conversation) {
      messages.value = [];
      return;
    }
    loading.value = true;
    try {
      const data = await getConversationMessages(conversation);
      messages.value = data;
    } catch (err) {
      useErrorStore().setError(`Error fetching messages: ${err.message}`);
    } finally {
      loading.value = false;
    }
  }

  function handleNewChat() {
    activeConversation.value = null;
    messages.value = [];
  }

  function handleConversationSelect(conversation) {
    activeConversation.value = conversation;
    fetchMessages(conversation);
  }

  async function sendMessage(input) {
    useErrorStore().clearError();
    loadingResponse.value = true;
    if (!input.trim()) return;

    const conversationId = activeConversation.value?.id || null;

    const userMessage = {
      conversation_id: conversationId,
      user_id: MORISIO,
      sender: "user", 
      content: input,
    };

    messages.value.push(userMessage);

    try {
      const coachResponse = await sendNewMessage(MORISIO, conversationId, input);
      messages.value.push(coachResponse);
      loadingResponse.value = false;

      if (!activeConversation.value) {
        const newConversation = {
          id: coachResponse.conversation_id,
          user_id: coachResponse.user_id,
          app_id: coachResponse.app_id,
          title: userMessage.content.slice(0, 20) + "...",
        };
        activeConversation.value = newConversation;
        conversations.value.push(newConversation);
      }
    } catch (err) {
      loadingResponse.value = false;
      useErrorStore().setError(`Error sending message: ${err.message}`);
    }
  }

  async function removeConversation(conversationId) {
    useErrorStore().clearError();
    loading.value = true;
    try {
      await deleteConversation(MORISIO, conversationId);
      conversations.value = conversations.value.filter(
        (c) => c.id !== conversationId
      );
      if (activeConversation.value?.id === conversationId) {
        activeConversation.value = null;
        messages.value = [];
      }
    } catch (err) {
      useErrorStore().setError(`Error deleting conversation: ${err.message}`);
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
