const API_BASE_URL = "https://coach-platform-fast-production.up.railway.app:8080/api";
const APP_ID = 1;

export async function sendNewMessage(user_id, conversation_id, input) {
  try {
    console.log("Sending message payload:", user_id, conversation_id, input);

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

export async function getConversations(userId) {
  console.log("Fetching conversations for user ID:", userId);
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

export async function getConversationMessages(conversation) {
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

export async function deleteConversation(userId, conversationId) {
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
