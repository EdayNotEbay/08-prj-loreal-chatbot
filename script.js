/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Store chat history (all previous Q&A pairs)
let chatHistory = "";

// Set initial message
chatWindow.innerHTML = `<div class="windowPlaceholder"> 👋 Hello! How can I help you today?</div>`;

// Messages array for OpenAI API
let messages = [
  {
    role: "system",
    content:
      "You are a chatbot for L'Oréal, a beauty and cosmetics company. You are here to assist users with their beauty-related queries. You should provide helpful, accurate, and friendly responses. If you don't know the answer, it's okay to say so. You can also ask for more details if needed. But make sure to tell the user in a friendly way that if there talking about something that is not related to L'Oréal or its products, you will not be able to help them.",
  },
];

// Handle form submit
async function sendToOpenAI(e) {
  e.preventDefault();

  const userMessage = userInput.value;
  if (!userMessage) return;

  messages.push({ role: "user", content: userMessage });

  // Show the latest user question in a special card
  chatWindow.innerHTML =
    chatHistory +
    `
    <div id="latestQA">
      <div class="msg user"><strong>You:</strong> ${userMessage}</div>
      <div id="thinkingMsg" class="msg ai" style="color: var(--eternal-gold);">Thinking...</div>
    </div>
  `;

  // Scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const data = {
    messages: messages,
    // model, temperature, max_tokens are handled in the worker
  };

  try {
    // The Cloudflare Worker endpoint is used here:
    const response = await fetch(
      "https://cloudflare-worker.egriffin3639.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    if (response.ok) {
      // Get the assistant's reply from the worker's response
      let assistantReply = result.choices[0].message.content;

      // Add assistant's reply to the messages array
      messages.push({ role: "assistant", content: assistantReply });

      // Build the completed Q&A card
      const completedQA = `
        <div class="msg user"><strong>You:</strong> ${userMessage}</div>
        <div class="msg ai"><strong>AI:</strong> ${assistantReply}</div>
      `;

      // Move this Q&A to chatHistory (wrap in #latestQA for consistent style)
      chatHistory += `<div id="latestQA">${completedQA}</div>`;

      // Update chat window to show all history (no "Thinking..." left)
      chatWindow.innerHTML = chatHistory;

      // Clear input
      userInput.value = "";

      // Scroll to bottom
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } else {
      const latestQA = document.getElementById("latestQA");
      if (latestQA) {
        latestQA.innerHTML += `<div style="color:red;">Sorry, something went wrong. Please try again.</div>`;
      }
    }
  } catch (error) {
    const latestQA = document.getElementById("latestQA");
    if (latestQA) {
      latestQA.innerHTML += `<div style="color:red;">Sorry, something went wrong. Please try again.</div>`;
    }
  }
}

// Listen for form submit
chatForm.addEventListener("submit", sendToOpenAI);
chatForm.addEventListener("submit", sendToOpenAI);
