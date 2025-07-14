/**
 * Authentication System for Portfolio Website
 * Provides secure login for admin access to CRUD operations
 */

class AuthManager {
  constructor() {
    this.storageKey = "portfolio_auth";
    this.sessionKey = "portfolio_session";
    this.tokenKey = "portfolio_token";
    this.init();
  }

  init() {
    console.log("Initializing AuthManager...");

    // Default admin credentials (should be changed in production)
    this.defaultCredentials = {
      username: "admin",
      password: this.hashPassword("rahmatez2024"), // Change this in production
      email: "rahmatezdev@gmail.com",
      role: "admin",
    };

    try {
      // Check if browser storage is available
      const testKey = "auth_manager_test";

      // Try localStorage
      let storageAvailable = false;
      try {
        localStorage.setItem(testKey, "test");
        if (localStorage.getItem(testKey) === "test") {
          storageAvailable = true;
          localStorage.removeItem(testKey);
        }
      } catch (e) {
        console.warn("localStorage not available:", e);
      }

      // If localStorage not available, try sessionStorage
      if (!storageAvailable) {
        try {
          sessionStorage.setItem(testKey, "test");
          if (sessionStorage.getItem(testKey) === "test") {
            storageAvailable = true;
            sessionStorage.removeItem(testKey);
          }
        } catch (e) {
          console.warn("sessionStorage not available:", e);
        }
      }

      if (!storageAvailable) {
        console.error("No storage available! Authentication will not work!");
        return;
      }

      // Initialize admin user if not exists
      const existingCredentials = this.getStoredCredentials();
      if (!existingCredentials) {
        console.log(
          "No existing credentials found, setting default credentials"
        );
        this.setStoredCredentials(this.defaultCredentials);
      } else {
        console.log(
          "Existing credentials found:",
          existingCredentials.username
        );
      }
    } catch (error) {
      console.error("Error during AuthManager initialization:", error);
    }
  }

  // Hash password using simple encryption (for demo purposes)
  hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36) + btoa(password).split("").reverse().join("");
  }

  // Verify password
  verifyPassword(inputPassword, hashedPassword) {
    return this.hashPassword(inputPassword) === hashedPassword;
  }

  // Generate session token
  generateToken() {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const token = btoa(`${timestamp}:${randomStr}`);
    return token;
  }

  // Validate token
  validateToken(token) {
    try {
      const decoded = atob(token);
      const [timestamp, randomStr] = decoded.split(":");
      const tokenAge = Date.now() - parseInt(timestamp);

      // Token expires after 24 hours
      return tokenAge < 24 * 60 * 60 * 1000;
    } catch (error) {
      return false;
    }
  }

  // Login method
  async login(username, password) {
    console.log("AuthManager login called with:", {
      username,
      password: "***",
    });

    try {
      const credentials = this.getStoredCredentials();
      console.log("Stored credentials:", credentials ? "found" : "not found");

      if (!credentials) {
        console.error("No admin account found");
        this.setStoredCredentials(this.defaultCredentials);
        console.log("Default credentials restored");

        // Try to get credentials again after restoring defaults
        const newCredentials = this.getStoredCredentials();
        if (!newCredentials) {
          throw new Error("Failed to restore admin account");
        }
      }

      // Get credentials again in case we just restored them
      const finalCredentials = this.getStoredCredentials();

      if (username !== finalCredentials.username) {
        console.log(
          "Username mismatch:",
          username,
          "vs",
          finalCredentials.username
        );
        throw new Error("Invalid username");
      }

      const passwordValid = this.verifyPassword(
        password,
        finalCredentials.password
      );
      console.log("Password verification result:", passwordValid);

      if (!passwordValid) {
        throw new Error("Invalid password");
      }

      // Generate session token
      const token = this.generateToken();
      const sessionData = {
        username: finalCredentials.username,
        email: finalCredentials.email,
        role: finalCredentials.role,
        loginTime: new Date().toISOString(),
        token: token,
      };

      console.log("Generated session data:", sessionData);

      // Store session - try to use different methods in case localStorage is blocked
      try {
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        sessionStorage.setItem(this.tokenKey, token);
        console.log(
          "Session stored successfully in localStorage and sessionStorage"
        );
      } catch (storageError) {
        console.warn(
          "Could not use localStorage, trying sessionStorage only",
          storageError
        );
        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        sessionStorage.setItem(this.tokenKey, token);
        console.log("Session stored in sessionStorage only");
      }

      this.dispatchAuthStateChanged();
      return sessionData;
    } catch (error) {
      console.error("Login error in AuthManager:", error);
      throw error;
    }

    this.dispatchAuthStateChanged();
    return sessionData;
  }

  // Logout method
  logout() {
    // Clear all auth data from both localStorage and sessionStorage
    try {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.tokenKey);
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }

    try {
      sessionStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem(this.tokenKey);
    } catch (e) {
      console.warn("Could not clear sessionStorage:", e);
    }

    console.log("User logged out, storage cleared");

    // Close all admin panels
    this.closeAllAdminPanels();

    this.dispatchAuthStateChanged();
    this.redirectToLogin();
  }

  // Close all admin panels
  closeAllAdminPanels() {
    // Close auth admin panel
    const authPanel = document.getElementById("admin-panel");
    if (authPanel) {
      authPanel.remove();
    }

    // Close project admin panel
    const projectPanel = document.getElementById("project-admin-panel");
    if (projectPanel) {
      projectPanel.remove();
    }

    // Close contact admin panel
    const contactPanel = document.getElementById("contact-admin-panel");
    if (contactPanel) {
      contactPanel.remove();
    }

    // Close password change modal
    const passwordModal = document.getElementById("password-modal");
    if (passwordModal) {
      passwordModal.remove();
    }

    // Close login modal
    const loginModal = document.getElementById("auth-modal");
    if (loginModal) {
      loginModal.remove();
    }
  }

  // Dispatch authentication state change event
  dispatchAuthStateChanged() {
    const event = new CustomEvent("authStateChanged", {
      detail: {
        isLoggedIn: this.isAuthenticated(),
        user: this.getSession(),
      },
    });
    window.dispatchEvent(event);
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      // First check sessionStorage for token
      const token = sessionStorage.getItem(this.tokenKey);
      console.log(
        "Session token in sessionStorage:",
        token ? "found" : "not found"
      );

      // Then get session from localStorage or sessionStorage
      let session = null;

      try {
        // Try localStorage first
        const sessionStr = localStorage.getItem(this.sessionKey);
        if (sessionStr) {
          session = JSON.parse(sessionStr);
        }
      } catch (e) {
        console.warn("Could not read from localStorage:", e);
      }

      // If no session in localStorage, try sessionStorage
      if (!session) {
        try {
          const sessionStr = sessionStorage.getItem(this.sessionKey);
          if (sessionStr) {
            session = JSON.parse(sessionStr);
          }
        } catch (e) {
          console.warn("Could not read from sessionStorage:", e);
        }
      }

      console.log("Session found:", session ? "yes" : "no");

      if (!session) {
        console.log("No session found in storage");
        return false;
      }

      if (!token || token !== session.token) {
        console.log("Token mismatch or not found");
        return false;
      }

      const isValid = this.validateToken(token);
      console.log("Token validation result:", isValid);

      return isValid;
    } catch (error) {
      console.error("Error in isAuthenticated:", error);
      return false;
    }
  }

  // Alias for isAuthenticated
  isLoggedIn() {
    return this.isAuthenticated();
  }

  // Get current session
  getSession() {
    try {
      // Try localStorage first
      try {
        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
      } catch (e) {
        console.warn("Could not read session from localStorage:", e);
      }

      // Then try sessionStorage
      try {
        const sessionData = sessionStorage.getItem(this.sessionKey);
        if (sessionData) {
          return JSON.parse(sessionData);
        }
      } catch (e) {
        console.warn("Could not read session from sessionStorage:", e);
      }

      return null;
    } catch (error) {
      console.error("Error in getSession:", error);
      return null;
    }
  }

  // Get stored credentials
  getStoredCredentials() {
    try {
      // Try localStorage first
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Could not read credentials from localStorage:", e);
      }

      // Then try sessionStorage as fallback
      try {
        const stored = sessionStorage.getItem(this.storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Could not read credentials from sessionStorage:", e);
      }

      return null;
    } catch (error) {
      console.error("Error in getStoredCredentials:", error);
      return null;
    }
  }

  // Set stored credentials
  setStoredCredentials(credentials) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(credentials));
      console.log("Credentials stored in localStorage");
    } catch (e) {
      console.warn("Failed to store credentials in localStorage:", e);
      try {
        sessionStorage.setItem(this.storageKey, JSON.stringify(credentials));
        console.log("Credentials stored in sessionStorage instead");
      } catch (e2) {
        console.error("Failed to store credentials in any storage:", e2);
        throw new Error("Could not save credentials to browser storage");
      }
    }
  }

  // Change password
  changePassword(currentPassword, newPassword) {
    const credentials = this.getStoredCredentials();

    if (!this.verifyPassword(currentPassword, credentials.password)) {
      throw new Error("Current password is incorrect");
    }

    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    credentials.password = this.hashPassword(newPassword);
    this.setStoredCredentials(credentials);

    return true;
  }

  // Show login modal
  showLoginModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById("auth-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.innerHTML = `
      <div class="auth-modal-overlay">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h3>Admin Login</h3>
            <button class="auth-modal-close">&times;</button>
          </div>
          <form id="login-form" class="auth-form">
            <div class="auth-form-group">
              <label for="username">Username:</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="auth-form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
            </div>
            <div class="auth-form-group">
              <button type="submit" class="auth-btn-login">Login</button>
            </div>
            <div id="auth-error" class="auth-error" style="display: none;"></div>
          </form>
          <div class="auth-info">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: admin</p>
            <p>Password: rahmatez2024</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.addAuthStyles();
    this.attachLoginEvents();
  }

  // Alias for showLoginModal
  showLogin() {
    this.showLoginModal();
  }

  // Add authentication styles
  addAuthStyles() {
    if (document.getElementById("auth-styles")) return;

    const style = document.createElement("style");
    style.id = "auth-styles";
    style.textContent = `
      .auth-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .auth-modal-content {
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }

      .auth-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }

      .auth-modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
      }

      .auth-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .auth-modal-close:hover {
        background: #f5f5f5;
        color: #333;
      }

      .auth-form-group {
        margin-bottom: 20px;
      }

      .auth-form-group label {
        display: block;
        margin-bottom: 5px;
        color: #333;
        font-weight: 500;
      }

      .auth-form-group input {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s;
        box-sizing: border-box;
      }

      .auth-form-group input:focus {
        outline: none;
        border-color: #ffd700;
      }

      .auth-btn-login {
        width: 100%;
        padding: 12px;
        background: linear-gradient(135deg, #ffd700, #ffb700);
        color: #333;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }

      .auth-btn-login:hover {
        background: linear-gradient(135deg, #ffb700, #ffd700);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
      }

      .auth-btn-login:active {
        transform: translateY(0);
      }

      .auth-error {
        background: #fee;
        color: #c33;
        padding: 10px;
        border-radius: 6px;
        margin-top: 10px;
        border: 1px solid #fcc;
      }

      .auth-info {
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #ffd700;
      }

      .auth-info p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
      }

      .auth-info strong {
        color: #333;
      }

      .auth-success {
        background: #d4edda;
        color: #155724;
        padding: 10px;
        border-radius: 6px;
        margin-top: 10px;
        border: 1px solid #c3e6cb;
      }

      .auth-admin-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        border: 1px solid #ddd;
      }

      .auth-admin-panel h4 {
        margin: 0 0 10px 0;
        color: #333;
      }

      .auth-admin-panel button {
        margin: 5px;
        padding: 8px 12px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .auth-admin-panel button:hover {
        background: #0056b3;
      }

      .auth-admin-panel .logout-btn {
        background: #dc3545;
      }

      .auth-admin-panel .logout-btn:hover {
        background: #c82333;
      }
    `;
    document.head.appendChild(style);
  }

  // Attach login event listeners
  attachLoginEvents() {
    const modal = document.getElementById("auth-modal");
    const closeBtn = modal.querySelector(".auth-modal-close");
    const loginForm = modal.querySelector("#login-form");

    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal.querySelector(".auth-modal-overlay")) {
        modal.remove();
      }
    });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const errorDiv = document.getElementById("auth-error");

      try {
        const session = await this.login(username, password);

        // Show success message
        errorDiv.style.display = "block";
        errorDiv.className = "auth-success";
        errorDiv.textContent =
          "Login successful! Welcome back, " + session.username;

        // Close modal after 1 second
        setTimeout(() => {
          modal.remove();
          this.showAdminPanel();
        }, 1000);
      } catch (error) {
        errorDiv.style.display = "block";
        errorDiv.className = "auth-error";
        errorDiv.textContent = error.message;
      }
    });
  }

  // Show admin panel
  showAdminPanel() {
    const session = this.getSession();
    if (!session) return;

    // Remove existing panel
    const existingPanel = document.getElementById("admin-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "admin-panel";
    panel.className = "auth-admin-panel";
    panel.innerHTML = `
      <h4>Admin Panel</h4>
      <p>Welcome, ${session.username}</p>
      <button onclick="authManager.showProjectAdmin()">Manage Projects</button>
      <button onclick="authManager.showContactAdmin()">Manage Contacts</button>
      <button onclick="authManager.showPasswordChange()">Change Password</button>
      <button onclick="authManager.logout()" class="logout-btn">Logout</button>
    `;

    document.body.appendChild(panel);
  }

  // Show project admin (protected)
  showProjectAdmin() {
    if (!this.isAuthenticated()) {
      this.showLoginModal();
      return;
    }

    if (typeof window.showProjectAdmin === "function") {
      window.showProjectAdmin();
    }
  }

  // Show contact admin (protected)
  showContactAdmin() {
    if (!this.isAuthenticated()) {
      this.showLoginModal();
      return;
    }

    if (typeof window.displayMessages === "function") {
      window.displayMessages();
    }
  }

  // Show password change modal
  showPasswordChange() {
    if (!this.isAuthenticated()) {
      this.showLoginModal();
      return;
    }

    // Remove existing modal if any
    const existingModal = document.getElementById("password-modal");
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement("div");
    modal.id = "password-modal";
    modal.innerHTML = `
      <div class="auth-modal-overlay">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h3>Change Password</h3>
            <button class="auth-modal-close">&times;</button>
          </div>
          <form id="password-form" class="auth-form">
            <div class="auth-form-group">
              <label for="current-password">Current Password:</label>
              <input type="password" id="current-password" name="current-password" required>
            </div>
            <div class="auth-form-group">
              <label for="new-password">New Password:</label>
              <input type="password" id="new-password" name="new-password" required minlength="8">
            </div>
            <div class="auth-form-group">
              <label for="confirm-password">Confirm New Password:</label>
              <input type="password" id="confirm-password" name="confirm-password" required minlength="8">
            </div>
            <div class="auth-form-group">
              <button type="submit" class="auth-btn-login">Change Password</button>
            </div>
            <div id="password-error" class="auth-error" style="display: none;"></div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachPasswordChangeEvents();
  }

  // Attach password change events
  attachPasswordChangeEvents() {
    const modal = document.getElementById("password-modal");
    const closeBtn = modal.querySelector(".auth-modal-close");
    const passwordForm = modal.querySelector("#password-form");

    closeBtn.addEventListener("click", () => {
      modal.remove();
    });

    passwordForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      const errorDiv = document.getElementById("password-error");

      if (newPassword !== confirmPassword) {
        errorDiv.style.display = "block";
        errorDiv.className = "auth-error";
        errorDiv.textContent = "New passwords do not match";
        return;
      }

      try {
        this.changePassword(currentPassword, newPassword);

        errorDiv.style.display = "block";
        errorDiv.className = "auth-success";
        errorDiv.textContent = "Password changed successfully!";

        setTimeout(() => {
          modal.remove();
        }, 1500);
      } catch (error) {
        errorDiv.style.display = "block";
        errorDiv.className = "auth-error";
        errorDiv.textContent = error.message;
      }
    });
  }

  // Redirect to login
  redirectToLogin() {
    // Don't automatically show login modal after logout
    // User can click login button if they want to login again
    console.log(
      "User has been logged out. Click Login button to authenticate again."
    );
  }

  // Check authentication on page load
  checkAuth() {
    if (this.isAuthenticated()) {
      this.showAdminPanel();
    }
  }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Protected function wrapper
function requireAuth(func) {
  return function (...args) {
    if (!authManager.isAuthenticated()) {
      authManager.showLoginModal();
      return;
    }
    return func.apply(this, args);
  };
}

// Override global functions to require authentication
if (typeof window !== "undefined") {
  // Protect project management functions
  if (typeof window.addProject === "function") {
    window.addProject = requireAuth(window.addProject);
  }
  if (typeof window.editProject === "function") {
    window.editProject = requireAuth(window.editProject);
  }
  if (typeof window.deleteProject === "function") {
    window.deleteProject = requireAuth(window.deleteProject);
  }
  if (typeof window.showProjectAdmin === "function") {
    window.showProjectAdmin = requireAuth(window.showProjectAdmin);
  }

  // Protect contact management functions
  if (typeof window.displayMessages === "function") {
    window.displayMessages = requireAuth(window.displayMessages);
  }
}

// Global access
window.authManager = authManager;
window.requireAuth = requireAuth;

// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
  authManager.checkAuth();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AuthManager, authManager, requireAuth };
}
