// plugins/chatApi.client.ts (or .ts if you want SSR support)
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? config.public.baseUrlProd
      : config.public.baseUrlDev;

  const APP_ID = 1;

  async function sendNewMessage(user_id: number, conversation_id: number, input: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/${APP_ID}/${user_id}/${conversation_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: input }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      return data.response;
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  async function getConversations(userId: number) {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/${APP_ID}/${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get conversations");
      return data.conversations;
    } catch (err) {
      console.error("Error fetching conversations:", err);
      throw err;
    }
  }

  async function getConversationMessages(conversation: { user_id: number; id: number }) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/${APP_ID}/${conversation.user_id}/${conversation.id}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get messages");
      return data.messages;
    } catch (err) {
      console.error("Error fetching messages:", err);
      throw err;
    }
  }

  async function deleteConversation(userId: number, conversationId: number) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/${APP_ID}/${userId}/${conversationId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete conversation");
      return data.message;
    } catch (err) {
      console.error("Error deleting conversation:", err);
      throw err;
    }
  }

  return {
    provide: {
      chatApi: {
        sendNewMessage,
        getConversations,
        getConversationMessages,
        deleteConversation,
      },
    },
  };
});
