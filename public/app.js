document.addEventListener("DOMContentLoaded", function() {
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message-input-box");
  const sendButton = document.getElementById("send-button");

  // Fetch initial chat messages if needed
  fetch('/api/messages')
    .then(response => response.json())
    .then(messages => {
      messages.forEach(message => {
        addMessageToChat(message);
      });
    });

  // Send a message when the "Send" button is clicked
  sendButton.addEventListener("click", function() {
    const messageText = messageInput.value;
    sendMessage(messageText);
  });

  // Send a message when the "Cmd-Enter" key is pressed
  messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      const messageText = messageInput.value;
      sendMessage(messageText);
    }
  });

  // Function to add message to chat box
  function addMessageToChat(message) {
    const messageElement = document.createElement("div");
    const messageP = document.createElement("p");
    messageElement.className = "message " + message.role;
    messageP.innerText = message.content;
    messageElement.appendChild(messageP);
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendLatestMessage(messageContent) {
    const lastMessageElement = chatBox.lastElementChild;
    lastMessageElement.children[0].innerText += messageContent;
  }

  // Function to send message to the backend
  function sendMessage(message) {
    addMessageToChat({ role: "user", content: message });
    addMessageToChat({ role: "assistant", content: '' });
    fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message })
    });
    const eventSource = new EventSource("/api/events");
    eventSource.onmessage = function(event) {
      messageInput.value = '';
      const message = JSON.parse(event.data);
      appendLatestMessage(message.content);
      if (message.finish_reason === "stop") {
        eventSource.close();
      }
    };
  }
}); 