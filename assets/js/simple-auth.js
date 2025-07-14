/**
 * Simple Auth Manager for Portfolio
 */
class SimpleAuthManager {
  constructor() {
    this.credentials = {
      username: "admin",
      password: "rahmatez2024",
    };
  }

  login(username, password) {
    // Direct comparison without hashing
    if (
      username === this.credentials.username &&
      password === this.credentials.password
    ) {
      // Store session with simple approach
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("loginTime", new Date().toISOString());

      return true;
    }
    return false;
  }

  isLoggedIn() {
    return localStorage.getItem("loggedIn") === "true";
  }

  logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("loginTime");
  }
}

// Create a global instance
const simpleAuthManager = new SimpleAuthManager();
