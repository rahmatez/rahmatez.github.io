/**
 * CRUD Operations for Contact Messages
 * Using IndexedDB for better storage capabilities
 */

class ContactManager {
  constructor() {
    this.dbName = "PortfolioContactDB";
    this.dbVersion = 1;
    this.storeName = "messages";
    this.db = null;
    this.init();
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });

          store.createIndex("email", "email", { unique: false });
          store.createIndex("date", "date", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
      };
    });
  }

  // CREATE - Add new message
  async createMessage(messageData) {
    await this.init();

    const message = {
      name: messageData.name,
      email: messageData.email,
      message: messageData.message,
      date: new Date().toISOString(),
      status: "unread",
      ip: await this.getClientIP(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(message);

      request.onsuccess = () => {
        const savedMessage = { ...message, id: request.result };

        // Also save to localStorage as a backup
        let localMessages = JSON.parse(
          localStorage.getItem("contact_messages") || "[]"
        );
        localMessages.push(savedMessage);
        localStorage.setItem("contact_messages", JSON.stringify(localMessages));

        resolve(savedMessage);
      };
      request.onerror = () => {
        console.error("Error saving to IndexedDB:", request.error);

        // Fallback to localStorage
        let localMessages = JSON.parse(
          localStorage.getItem("contact_messages") || "[]"
        );
        const newMessage = { ...message, id: Date.now() };
        localMessages.push(newMessage);
        localStorage.setItem("contact_messages", JSON.stringify(localMessages));

        resolve(newMessage);
      };
    });
  }

  // READ - Get all messages
  async getAllMessages() {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          // If no messages in IndexedDB, check localStorage
          if (request.result.length === 0) {
            const localMessages = JSON.parse(
              localStorage.getItem("contact_messages") || "[]"
            );
            console.log("Retrieved messages from localStorage:", localMessages);
            resolve(localMessages);
          } else {
            console.log("Retrieved messages from IndexedDB:", request.result);
            resolve(request.result);
          }
        };

        request.onerror = () => {
          console.error(
            "Error retrieving from IndexedDB, falling back to localStorage"
          );
          const localMessages = JSON.parse(
            localStorage.getItem("contact_messages") || "[]"
          );
          console.log(
            "Retrieved messages from localStorage fallback:",
            localMessages
          );
          resolve(localMessages);
        };
      });
    } catch (error) {
      console.error(
        "Critical error in getAllMessages, using localStorage fallback:",
        error
      );
      return Promise.resolve(
        JSON.parse(localStorage.getItem("contact_messages") || "[]")
      );
    }
  }

  // READ - Get message by ID
  async getMessageById(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // READ - Get messages by status
  async getMessagesByStatus(status) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const index = store.index("status");
      const request = index.getAll(status);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // EXPORT - Export messages to JSON file
  async exportMessages() {
    const messages = await this.getAllMessages();
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `contact-messages-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  // UTILITY - Get message statistics
  async getStats() {
    const messages = await this.getAllMessages();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: messages.length,
      unread: messages.filter((m) => m.status === "unread").length,
      read: messages.filter((m) => m.status === "read").length,
      today: messages.filter((m) => new Date(m.date) >= today).length,
      thisWeek: messages.filter((m) => {
        const msgDate = new Date(m.date);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return msgDate >= weekAgo;
      }).length,
    };
  }

  // UPDATE - Update message status
  async updateMessageStatus(id, newStatus) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          const message = request.result;
          if (message) {
            message.status = newStatus;
            store.put(message);

            // Also update in localStorage
            this._updateLocalStorageMessage(id, { status: newStatus });

            resolve(message);
          } else {
            // Message not found in IndexedDB, try updating in localStorage
            const updated = this._updateLocalStorageMessage(id, {
              status: newStatus,
            });
            if (updated) {
              resolve({ id, status: newStatus });
            } else {
              reject(new Error(`Message with ID ${id} not found`));
            }
          }
        };

        request.onerror = () => {
          // Try localStorage as fallback
          const updated = this._updateLocalStorageMessage(id, {
            status: newStatus,
          });
          if (updated) {
            resolve({ id, status: newStatus });
          } else {
            reject(request.error);
          }
        };
      });
    } catch (error) {
      console.error(
        "Error updating message status, trying localStorage:",
        error
      );
      const updated = this._updateLocalStorageMessage(id, {
        status: newStatus,
      });
      return updated
        ? Promise.resolve({ id, status: newStatus })
        : Promise.reject(error);
    }
  }

  // DELETE - Remove message
  async deleteMessage(id) {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
          // Also delete from localStorage
          this._deleteLocalStorageMessage(id);
          resolve();
        };

        request.onerror = () => {
          // Try localStorage as fallback
          const deleted = this._deleteLocalStorageMessage(id);
          if (deleted) {
            resolve();
          } else {
            reject(request.error);
          }
        };
      });
    } catch (error) {
      console.error("Error deleting message, trying localStorage:", error);
      const deleted = this._deleteLocalStorageMessage(id);
      return deleted ? Promise.resolve() : Promise.reject(error);
    }
  }

  // CLEAR ALL - Clear all messages
  async clearAllMessages() {
    try {
      await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          // Also clear localStorage
          localStorage.removeItem("contact_messages");
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error("Error clearing messages:", error);
      // Try clearing localStorage as fallback
      localStorage.removeItem("contact_messages");
      return Promise.resolve();
    }
  }

  // Helper method to update a message in localStorage
  _updateLocalStorageMessage(id, updates) {
    try {
      const messages = JSON.parse(
        localStorage.getItem("contact_messages") || "[]"
      );
      const messageIndex = messages.findIndex((msg) => msg.id == id);

      if (messageIndex !== -1) {
        messages[messageIndex] = { ...messages[messageIndex], ...updates };
        localStorage.setItem("contact_messages", JSON.stringify(messages));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating message in localStorage:", error);
      return false;
    }
  }

  // Helper method to delete a message from localStorage
  _deleteLocalStorageMessage(id) {
    try {
      const messages = JSON.parse(
        localStorage.getItem("contact_messages") || "[]"
      );
      const filteredMessages = messages.filter((msg) => msg.id != id);

      if (filteredMessages.length !== messages.length) {
        localStorage.setItem(
          "contact_messages",
          JSON.stringify(filteredMessages)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting message from localStorage:", error);
      return false;
    }
  }

  // Get client IP (for tracking)
  async getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "unknown";
    }
  }

  // Search messages
  async searchMessages(query) {
    const messages = await this.getAllMessages();
    const lowerQuery = query.toLowerCase();

    return messages.filter(
      (message) =>
        message.name.toLowerCase().includes(lowerQuery) ||
        message.email.toLowerCase().includes(lowerQuery) ||
        message.message.toLowerCase().includes(lowerQuery)
    );
  }
}

// Initialize contact manager
let contactManager;

// Check if we already have a contact manager instance in localStorage
// This ensures we use the same instance across pages
if (window.contactManager) {
  contactManager = window.contactManager;
  console.log("Using existing contactManager instance");
} else {
  contactManager = new ContactManager();
  console.log("Created new ContactManager instance");
}

// Global access - make sure it's available globally
window.contactManager = contactManager;

// Enhanced contact form submission
async function submitContactForm(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const messageData = {
    name: formData.get("fullname"),
    email: formData.get("email"),
    message: formData.get("message"),
  };

  try {
    // Save to IndexedDB
    const savedMessage = await contactManager.createMessage(messageData);

    // Show success message
    showNotification("Message sent successfully!", "success");

    // Reset form
    event.target.reset();

    // Optional: Still send via email
    const emailBody = `Name: ${messageData.name}\nEmail: ${messageData.email}\nMessage: ${messageData.message}`;
    const emailUrl = `mailto:rahmatezdev@gmail.com?subject=Contact from ${
      messageData.name
    }&body=${encodeURIComponent(emailBody)}`;

    // Open email client
    window.open(emailUrl);

    console.log("Message saved:", savedMessage);
  } catch (error) {
    console.error("Error saving message:", error);
    showNotification("Error sending message. Please try again.", "error");
  }
}

// Admin panel functions - Protected by authentication
async function displayMessages() {
  // Check if user is authenticated
  if (!window.authManager || !window.authManager.isLoggedIn()) {
    if (window.authManager) {
      window.authManager.showLogin();
    } else {
      alert("Authentication required. Please login to view messages.");
    }
    return;
  }

  // Check if admin panel already exists
  const existingPanel = document.getElementById("contact-admin-panel");
  if (existingPanel) {
    existingPanel.remove();
  }

  const messages = await contactManager.getAllMessages();
  const stats = await contactManager.getStats();

  console.log("Contact Statistics:", stats);
  console.log("All Messages:", messages);

  // Create admin panel (for development)
  const adminPanel = document.createElement("div");
  adminPanel.id = "contact-admin-panel";
  adminPanel.innerHTML = `
    <div style="position: fixed; top: 10px; right: 10px; background: white; padding: 20px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; max-width: 400px;">
      <h3>Contact Messages (${stats.total})</h3>
      <p>Unread: ${stats.unread} | Today: ${stats.today} | This Week: ${
    stats.thisWeek
  }</p>
      <button onclick="contactManager.exportMessages()" style="margin-bottom: 10px;">Export Messages</button>
      <div style="max-height: 300px; overflow-y: auto;">
        ${messages
          .map(
            (msg) => `
          <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <strong>${msg.name}</strong> (${msg.email})
            <br><small>${new Date(msg.date).toLocaleString()}</small>
            <br><span style="color: ${
              msg.status === "unread" ? "red" : "green"
            };">${msg.status}</span>
            <br><em>${msg.message}</em>
            <br>
            <button onclick="contactManager.updateMessageStatus(${msg.id}, '${
              msg.status === "unread" ? "read" : "unread"
            }').then(() => displayMessages())">
              Mark as ${msg.status === "unread" ? "Read" : "Unread"}
            </button>
            <button onclick="contactManager.deleteMessage(${
              msg.id
            }).then(() => displayMessages())">Delete</button>
          </div>
        `
          )
          .join("")}
      </div>
      <button onclick="closeContactAdmin()" style="margin-top: 10px;">Close</button>
    </div>
  `;

  document.body.appendChild(adminPanel);
}

// Function to close contact admin panel
function closeContactAdmin() {
  const adminPanel = document.getElementById("contact-admin-panel");
  if (adminPanel) {
    adminPanel.remove();
  }
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    background: ${
      type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#007bff"
    };
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Global access
window.contactManager = contactManager;
window.displayMessages = displayMessages;
window.submitContactForm = submitContactForm;
window.closeContactAdmin = closeContactAdmin;
