// Global variables
let currentSection = "dashboard";
let currentFilter = "all";
let searchQuery = "";

// Initialize dashboard
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication
  if (!simpleAuthManager.isLoggedIn()) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  // Load user info
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("adminUsername").textContent = username;
    document.querySelector(".user-avatar").textContent = username
      .charAt(0)
      .toUpperCase();
  }

  // Load dashboard data
  loadDashboardData();

  // Load initial sections
  loadProjectsTable();
  loadMessagesTable();

  // Add real-time validation for image URL
  const projectImageInput = document.getElementById("projectImage");
  if (projectImageInput) {
    projectImageInput.addEventListener("input", function () {
      const value = this.value.trim();
      const isValid = isValidImagePath(value);

      if (value === "") {
        // Empty is allowed
        this.style.borderColor = "var(--onyx)";
        this.setCustomValidity("");
      } else if (isValid) {
        // Valid path/URL
        this.style.borderColor = "#4CAF50";
        this.setCustomValidity("");
      } else {
        // Invalid path/URL
        this.style.borderColor = "#f44336";
        this.setCustomValidity("Please enter a valid image URL or path");
      }
    });
  }

  // Add real-time validation for project link
  const projectLinkInput = document.getElementById("projectLink");
  if (projectLinkInput) {
    projectLinkInput.addEventListener("input", function () {
      const value = this.value.trim();
      const isValid = isValidProjectLink(value);

      if (value === "") {
        // Empty is allowed for optional field
        this.style.borderColor = "var(--onyx)";
        this.setCustomValidity("");
      } else if (isValid) {
        // Valid link/URL
        this.style.borderColor = "#4CAF50";
        this.setCustomValidity("");
      } else {
        // Invalid link/URL
        this.style.borderColor = "#f44336";
        this.setCustomValidity("Please enter a valid project link");
      }
    });
  }
});

// Section management
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });

  // Show selected section
  document.getElementById(sectionName + "-section").style.display = "block";

  // Update navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  currentSection = sectionName;

  // Load section data
  if (sectionName === "dashboard") {
    loadDashboardData();
  } else if (sectionName === "projects") {
    loadProjectsTable();
  } else if (sectionName === "contacts") {
    loadMessagesTable();
  } else if (sectionName === "blogs") {
    loadBlogsTable();
  }
}

// Load dashboard data
function loadDashboardData() {
  const projects = projectManager.getAllProjects();
  const blogs = blogManager.getAllBlogs();
  const stats = contactManager.getStats();

  document.getElementById("totalProjects").textContent = projects.length;

  // Load contact stats
  contactManager.getStats().then((contactStats) => {
    document.getElementById("totalContacts").textContent = contactStats.total;
    document.getElementById("unreadMessages").textContent = contactStats.unread;
    document.getElementById("todayMessages").textContent = contactStats.today;
  });

  // Load recent projects
  const recentProjects = projects.slice(-5).reverse();
  const recentProjectsHTML = recentProjects
    .map(
      (project) => `
                <div style="padding: 10px; border-bottom: 1px solid var(--onyx);">
                    <strong>${project.title}</strong><br>
                    <small>${project.category}</small>
                </div>
            `
    )
    .join("");
  document.getElementById("recentProjects").innerHTML =
    recentProjectsHTML || "<p>No projects yet</p>";

  // Load recent messages
  contactManager.getAllMessages().then((messages) => {
    const recentMessages = messages.slice(-5).reverse();
    const recentMessagesHTML = recentMessages
      .map(
        (msg) => `
                    <div style="padding: 10px; border-bottom: 1px solid var(--onyx);">
                        <strong>${msg.name}</strong><br>
                        <small>${msg.email}</small>
                    </div>
                `
      )
      .join("");
    document.getElementById("recentMessages").innerHTML =
      recentMessagesHTML || "<p>No messages yet</p>";
  });

  // Update stats grid to include blog count
  const statsGrid = document.querySelector(".stats-grid");
  if (statsGrid) {
    const blogStatsCard = document.createElement("div");
    blogStatsCard.className = "stat-card";
    blogStatsCard.innerHTML = `
            <div class="stat-number">${blogs.length}</div>
            <div class="stat-label">Total Blog Posts</div>
          `;

    // Check if blog stats card already exists
    const existingBlogStats = Array.from(statsGrid.children).find(
      (card) =>
        card.querySelector(".stat-label").textContent === "Total Blog Posts"
    );

    if (!existingBlogStats && statsGrid.children.length >= 4) {
      statsGrid.appendChild(blogStatsCard);
    }
  }
}

// Project management functions
function loadProjectsTable() {
  const projects = projectManager.getAllProjects();
  let filteredProjects = projects;

  // Apply filters
  if (currentFilter !== "all") {
    filteredProjects = projects.filter(
      (project) =>
        project.category.toLowerCase() === currentFilter.toLowerCase()
    );
  }

  // Apply search
  if (searchQuery) {
    filteredProjects = filteredProjects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Technologies</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredProjects
                          .map(
                            (project) => `
                            <tr>
                                <td>${project.title}</td>
                                <td>${project.category}</td>
                                <td>${
                                  project.technologies
                                    ? project.technologies.join(", ")
                                    : "N/A"
                                }</td>
                                <td>${new Date(
                                  project.createdAt
                                ).toLocaleDateString()}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="action-btn edit" onclick="editProject('${
                                          project.id
                                        }')">Edit</button>
                                        <button class="action-btn delete" onclick="deleteProject('${
                                          project.id
                                        }')">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;

  document.getElementById("projectsTable").innerHTML = filteredProjects.length
    ? tableHTML
    : '<div class="empty-state">No projects found</div>';
}

// Message management functions
function loadMessagesTable() {
  console.log("Loading messages table...");

  // Run debug first
  debugStorage();

  // PERBAIKAN: Selalu periksa langsung dari localStorage terlebih dahulu
  // untuk memastikan semua pesan terambil
  let localStorageMessages = JSON.parse(
    localStorage.getItem("contact_messages") || "[]"
  );
  console.log("Directly checking localStorage first:", localStorageMessages);

  // Try to get messages from contactManager
  contactManager
    .getAllMessages()
    .then((messages) => {
      console.log("Messages retrieved from contactManager:", messages);

      // PERBAIKAN: Gabungkan pesan dari kedua sumber dan hilangkan duplikat
      let combinedMessages = [...messages];

      // Tambahkan pesan dari localStorage yang belum ada di IndexedDB
      if (localStorageMessages && localStorageMessages.length > 0) {
        localStorageMessages.forEach((localMsg) => {
          // Periksa apakah pesan ini sudah ada di messages dari IndexedDB
          const isDuplicate = combinedMessages.some(
            (msg) =>
              msg.id === localMsg.id ||
              (msg.name === localMsg.name &&
                msg.email === localMsg.email &&
                msg.message === localMsg.message &&
                msg.date === localMsg.date)
          );

          if (!isDuplicate) {
            combinedMessages.push(localMsg);
            console.log("Added missing message from localStorage:", localMsg);
          }
        });
      }

      // Gunakan combined messages
      messages = combinedMessages;
      console.log("Combined unique messages:", messages);

      let filteredMessages = messages;

      // PERBAIKAN: Sort messages by date (newest first)
      messages.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
      console.log("Messages sorted by date (newest first):", messages);

      // Apply filters
      if (currentFilter === "unread") {
        filteredMessages = messages.filter((msg) => msg.status === "unread");
      } else if (currentFilter === "read") {
        filteredMessages = messages.filter((msg) => msg.status === "read");
      } else if (currentFilter === "today") {
        const today = new Date().toDateString();
        filteredMessages = messages.filter(
          (msg) => new Date(msg.date).toDateString() === today
        );
      }

      // Apply search
      if (searchQuery) {
        filteredMessages = filteredMessages.filter(
          (msg) =>
            msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.message.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      const tableHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Message</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredMessages
                              .map(
                                (msg) => `
                                <tr>
                                    <td>${msg.name}</td>
                                    <td>${msg.email}</td>
                                    <td>${msg.message.substring(0, 50)}...</td>
                                    <td>${new Date(
                                      msg.date
                                    ).toLocaleDateString()}</td>
                                    <td>
                                        <span style="color: ${
                                          msg.status === "unread"
                                            ? "red"
                                            : "green"
                                        };">
                                            ${msg.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="action-btn edit" onclick="toggleMessageStatus(${
                                              msg.id
                                            }, '${msg.status}')">
                                                ${
                                                  msg.status === "unread"
                                                    ? "Mark Read"
                                                    : "Mark Unread"
                                                }
                                            </button>
                                            <button class="action-btn delete" onclick="deleteMessage(${
                                              msg.id
                                            })">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `
                              )
                              .join("")}
                        </tbody>
                    </table>
                `;

      const messagesTableEl = document.getElementById("messagesTable");
      if (messagesTableEl) {
        messagesTableEl.innerHTML = filteredMessages.length
          ? tableHTML
          : '<div class="empty-state">No messages found</div>';
      } else {
        console.error("messagesTable element not found!");
      }
    })
    .catch((error) => {
      console.error("Error loading messages:", error);
      document.getElementById(
        "messagesTable"
      ).innerHTML = `<div class="empty-state">Error loading messages. Please check console for details.</div>`;
    });
}

// Blog management functions
function loadBlogsTable() {
  const blogs = blogManager.getAllBlogs();
  let filteredBlogs = blogs;

  // Apply filters
  if (currentFilter !== "all") {
    filteredBlogs = blogs.filter(
      (blog) => blog.category.toLowerCase() === currentFilter.toLowerCase()
    );
  }

  // Apply search
  if (searchQuery) {
    filteredBlogs = filteredBlogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>External Link</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredBlogs
                          .map(
                            (blog) => `
                            <tr>
                                <td>${blog.title}</td>
                                <td>${blog.category}</td>
                                <td>${new Date(
                                  blog.date
                                ).toLocaleDateString()}</td>
                                <td>${
                                  blog.externalLink
                                    ? '<a href="' +
                                      blog.externalLink +
                                      '" target="_blank">View</a>'
                                    : "N/A"
                                }</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="action-btn edit" onclick="editBlog('${
                                          blog.id
                                        }')">Edit</button>
                                        <button class="action-btn delete" onclick="deleteBlog('${
                                          blog.id
                                        }')">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            `;

  document.getElementById("blogsTable").innerHTML = filteredBlogs.length
    ? tableHTML
    : '<div class="empty-state">No blog posts found</div>';
}

// Modal management for blogs
function showAddBlogModal() {
  document.getElementById("blogModalTitle").textContent = "Add New Blog Post";
  document.getElementById("blogForm").reset();
  document.getElementById("blogId").value = "";

  // Set current date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("blogDate").value = today;

  document.getElementById("blogModal").style.display = "block";
}

// Blog CRUD operations
function editBlog(id) {
  const blog = blogManager.getBlogById(id);
  if (!blog) return;

  document.getElementById("blogModalTitle").textContent = "Edit Blog Post";
  document.getElementById("blogId").value = blog.id;
  document.getElementById("blogTitle").value = blog.title;
  document.getElementById("blogCategory").value = blog.category;
  document.getElementById("blogImage").value = blog.image;
  document.getElementById("blogContent").value = blog.content;
  document.getElementById("blogExternalLink").value = blog.externalLink || "";

  // Format date for input field
  const blogDate = new Date(blog.date);
  const formattedDate = blogDate.toISOString().split("T")[0];
  document.getElementById("blogDate").value = formattedDate;

  document.getElementById("blogModal").style.display = "block";
}

function deleteBlog(id) {
  if (confirm("Are you sure you want to delete this blog post?")) {
    blogManager.deleteBlog(id);
    loadBlogsTable();
    loadDashboardData();
  }
}

// Filter functions for blogs
function filterBlogs(category) {
  currentFilter = category;
  document
    .querySelectorAll(".filter-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");
  loadBlogsTable();
}

// Search function for blogs
function searchBlogs(query) {
  searchQuery = query;
  loadBlogsTable();
}

// Export/Import functions for blogs
function exportBlogs() {
  blogManager.exportBlogs();
}

function importBlogs(input) {
  const file = input.files[0];
  if (file) {
    blogManager
      .importBlogs(file)
      .then(() => {
        loadBlogsTable();
        loadDashboardData();
        alert("Blog posts imported successfully!");
      })
      .catch((err) => {
        alert("Error importing blog posts: " + err.message);
      });
  }
}

// Modal management
function showAddProjectModal() {
  document.getElementById("projectModalTitle").textContent = "Add New Project";
  document.getElementById("projectForm").reset();
  document.getElementById("projectId").value = "";
  document.getElementById("projectModal").style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Project CRUD operations
function editProject(id) {
  const project = projectManager.getProjectById(id);
  if (!project) return;

  document.getElementById("projectModalTitle").textContent = "Edit Project";
  document.getElementById("projectId").value = project.id;
  document.getElementById("projectTitle").value = project.title;
  document.getElementById("projectCategory").value = project.category;
  document.getElementById("projectImage").value = project.image;
  document.getElementById("projectDescription").value = project.description;
  document.getElementById("projectTechnologies").value = project.technologies
    ? project.technologies.join(", ")
    : "";
  document.getElementById("projectLink").value = project.link || "";

  document.getElementById("projectModal").style.display = "block";
}

function deleteProject(id) {
  if (confirm("Are you sure you want to delete this project?")) {
    projectManager.deleteProject(id);
    loadProjectsTable();
    loadDashboardData();
  }
}

// Message operations
function toggleMessageStatus(id, currentStatus) {
  const newStatus = currentStatus === "unread" ? "read" : "unread";
  contactManager.updateMessageStatus(id, newStatus).then(() => {
    loadMessagesTable();
    loadDashboardData();
  });
}

function deleteMessage(id) {
  if (confirm("Are you sure you want to delete this message?")) {
    contactManager.deleteMessage(id).then(() => {
      loadMessagesTable();
      loadDashboardData();
    });
  }
}

// Filter functions
function filterProjects(category) {
  currentFilter = category;
  document
    .querySelectorAll(".filter-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");
  loadProjectsTable();
}

function filterMessages(status) {
  currentFilter = status;
  document
    .querySelectorAll(".filter-tab")
    .forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");
  loadMessagesTable();
}

// Search functions
function searchProjects(query) {
  searchQuery = query;
  loadProjectsTable();
}

function searchMessages(query) {
  searchQuery = query;
  loadMessagesTable();
}

// Export functions
function exportProjects() {
  projectManager.exportProjects();
}

function exportContacts() {
  contactManager.exportMessages();
}

// Import functions
function importProjects(input) {
  const file = input.files[0];
  if (file) {
    projectManager
      .importProjects(file)
      .then(() => {
        loadProjectsTable();
        loadDashboardData();
        alert("Projects imported successfully!");
      })
      .catch((err) => {
        alert("Error importing projects: " + err.message);
      });
  }
}

// Settings functions
function showChangePasswordModal() {
  alert("Password change functionality not available in simple mode");
  // You can add password change functionality directly here if needed
}

function backupAllData() {
  const data = {
    projects: projectManager.getAllProjects(),
    contacts: contactManager.getAllMessages(),
    blogs: blogManager.getAllBlogs(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "portfolio-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}

function clearAllData() {
  if (
    confirm("Are you sure you want to clear all data? This cannot be undone.")
  ) {
    localStorage.clear();
    location.reload();
  }
}

function clearAllMessages() {
  if (
    confirm(
      "Are you sure you want to clear all messages? This cannot be undone."
    )
  ) {
    contactManager.clearAllMessages().then(() => {
      loadMessagesTable();
      loadDashboardData();
    });
  }
}

// Logout function
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    simpleAuthManager.logout();
    window.location.href = "../pages/project.html";
  }
}

// Project Form submission
document.getElementById("projectForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Custom validation for image URL/path
  const imageValue = document.getElementById("projectImage").value.trim();
  if (!isValidImagePath(imageValue)) {
    alert(
      "Please enter a valid image URL or path (e.g., ../assets/images/project.jpg or https://example.com/image.jpg)"
    );
    return;
  }

  // Custom validation for project link
  const linkValue = document.getElementById("projectLink").value.trim();
  if (!isValidProjectLink(linkValue)) {
    alert(
      "Please enter a valid project link (e.g., github.com/user/repo or https://example.com)"
    );
    return;
  }

  // Normalize image path for consistency
  const normalizedImagePath = normalizeImagePath(imageValue);

  const projectData = {
    title: document.getElementById("projectTitle").value,
    category: document.getElementById("projectCategory").value,
    image: normalizedImagePath,
    description: document.getElementById("projectDescription").value,
    technologies: document
      .getElementById("projectTechnologies")
      .value.split(",")
      .map((t) => t.trim()),
    link: linkValue,
  };

  const projectId = document.getElementById("projectId").value;

  if (projectId) {
    // Update existing project
    projectManager.updateProject(projectId, projectData);
  } else {
    // Create new project
    projectManager.createProject(projectData);
  }

  closeModal("projectModal");
  loadProjectsTable();
  loadDashboardData();
});

// Blog Form submission
document.getElementById("blogForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Custom validation for image URL/path
  const imageValue = document.getElementById("blogImage").value.trim();
  if (!isValidImagePath(imageValue)) {
    alert(
      "Please enter a valid image URL or path (e.g., ../assets/images/blog-1.jpg or https://example.com/image.jpg)"
    );
    return;
  }

  // Custom validation for external link (if provided)
  const externalLinkValue = document
    .getElementById("blogExternalLink")
    .value.trim();
  if (externalLinkValue && !isValidProjectLink(externalLinkValue)) {
    alert(
      "Please enter a valid external link (e.g., medium.com/article or https://example.com/blog)"
    );
    return;
  }

  // Format date to ISO string
  const dateValue = document.getElementById("blogDate").value;
  const formattedDate = new Date(dateValue);
  formattedDate.setHours(10, 0, 0, 0); // Set time to 10:00:00

  // Normalize image path for consistency
  const normalizedImagePath = normalizeImagePath(imageValue);

  const blogData = {
    title: document.getElementById("blogTitle").value,
    category: document.getElementById("blogCategory").value,
    image: normalizedImagePath,
    content: document.getElementById("blogContent").value,
    externalLink: externalLinkValue,
    date: formattedDate.toISOString(),
  };

  const blogId = document.getElementById("blogId").value;

  if (blogId) {
    // Update existing blog
    blogManager.updateBlog(blogId, blogData);
  } else {
    // Create new blog
    blogManager.createBlog(blogData);
  }

  closeModal("blogModal");
  loadBlogsTable();
  loadDashboardData();
});

// Close modal when clicking outside
window.onclick = function (event) {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
};

// Normalize image path for consistency across admin and frontend
function normalizeImagePath(path) {
  console.log("Normalizing image path:", path);
  
  if (!path || path.trim() === "") {
    return "";
  }

  const trimmedPath = path.trim();

  // Handle Windows absolute paths (C:\ or c:\)
  if (trimmedPath.match(/^[a-zA-Z]:\\/)) {
    console.log("Detected Windows absolute path");
    // Extract just the filename from the path
    const pathParts = trimmedPath.split('\\');
    const filename = pathParts[pathParts.length - 1];
    const newPath = `../assets/images/${filename}`;
    console.log("Converted Windows path to:", newPath);
    return newPath;
  }

  // If it's a full URL (http/https), keep as is
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    return trimmedPath;
  }

  // If it's already a correct relative path for pages folder, keep as is
  if (trimmedPath.startsWith("../assets/images/")) {
    return trimmedPath;
  }

  // If it starts with /assets/images/, convert to relative path
  if (trimmedPath.startsWith("/assets/images/")) {
    return ".." + trimmedPath;
  }

  // If it starts with assets/images/, add ../
  if (trimmedPath.startsWith("assets/images/")) {
    return "../" + trimmedPath;
  }

  // If it's just a filename, assume it's in assets/images/
  if (!trimmedPath.includes("/") && !trimmedPath.includes("\\")) {
    return "../assets/images/" + trimmedPath;
  }

  // Default: assume it needs ../ prefix for pages folder
  const result = trimmedPath.startsWith("../") ? trimmedPath : "../" + trimmedPath;
  console.log("Normalized path result:", result);
  return result;
}

// Validate image path/URL
function isValidImagePath(path) {
  if (!path || path.trim() === "") {
    return false;
  }

  const trimmedPath = path.trim();
  
  // Allow Windows absolute paths (we'll convert them later)
  if (trimmedPath.match(/^[a-zA-Z]:\\/)) {
    console.log("Windows path detected in validation:", trimmedPath);
    // Extract the filename and check its extension
    const pathParts = trimmedPath.split('\\');
    const filename = pathParts[pathParts.length - 1];
    const hasValidExtension = /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(filename);
    console.log("Windows path has valid extension?", hasValidExtension);
    return hasValidExtension;
  }

  // Allow various formats:
  // 1. Full URLs (http/https)
  // 2. Relative paths (../assets/images/...)
  // 3. Absolute paths (/assets/images/...)
  // 4. Current directory paths (./assets/...)
  // 5. Simple filenames with image extensions
  return (
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://") ||
    trimmedPath.startsWith("/") ||
    trimmedPath.startsWith("./") ||
    trimmedPath.startsWith("../") ||
    trimmedPath.startsWith("assets/") ||
    /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(trimmedPath)
  );
}

// Validate project link/URL
function isValidProjectLink(link) {
  if (!link || link.trim() === "") {
    return true; // Empty is allowed for optional field
  }

  const trimmedLink = link.trim();

  // Allow various formats:
  // 1. Full URLs (http/https)
  // 2. Domain names (github.com, example.com)
  // 3. Paths (github.com/user/repo)
  // 4. Localhost/IP addresses
  return (
    trimmedLink.startsWith("http://") ||
    trimmedLink.startsWith("https://") ||
    trimmedLink.startsWith("ftp://") ||
    trimmedLink.startsWith("localhost") ||
    trimmedLink.startsWith("127.0.0.1") ||
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,})(\/.*)?$/.test(
      trimmedLink
    ) || // Domain with optional path
    /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(trimmedLink) || // Simple domain
    /#/.test(trimmedLink) // Allow # for placeholder links
  );
}

// Fix duplicate images function
function fixDuplicateImages() {
  if (
    !confirm(
      "🔧 This will automatically assign unique images to projects that have duplicate or broken images. Continue?"
    )
  ) {
    return;
  }

  let projects = projectManager.getAllProjects();
  const imageMapping = {
    Finance: "../assets/images/project-1.jpg",
    Orizon: "../assets/images/project-2.png",
    Fundo: "../assets/images/project-3.jpg",
    Brawlhalla: "../assets/images/project-4.png",
    DSM: "../assets/images/project-5.png",
    MetaSpark: "../assets/images/project-6.png",
    Summary: "../assets/images/project-7.png",
    "Task Management": "../assets/images/project-8.jpg",
    Arrival: "../assets/images/project-9.png",
  };

  const availableImages = [
    "../assets/images/project-1.jpg",
    "../assets/images/project-2.png",
    "../assets/images/project-3.jpg",
    "../assets/images/project-4.png",
    "../assets/images/project-5.png",
    "../assets/images/project-6.png",
    "../assets/images/project-7.png",
    "../assets/images/project-8.jpg",
    "../assets/images/project-9.png",
  ];

  // Track used images to avoid duplicates
  const usedImages = new Set();
  let fixedCount = 0;

  projects.forEach((project, index) => {
    let needsFix = false;
    let newImage = project.image;

    // Check if project has a predefined image mapping
    if (imageMapping[project.title]) {
      newImage = imageMapping[project.title];
    }
    // Check if image is already used by another project or is broken
    else if (
      usedImages.has(project.image) ||
      !project.image ||
      project.image.endsWith("project-1.jpg")
    ) {
      needsFix = true;
    }

    // Find unused image
    if (needsFix) {
      newImage = availableImages.find((img) => !usedImages.has(img));
      if (!newImage) {
        // If all images are used, cycle through them
        newImage = availableImages[index % availableImages.length];
      }
    }

    if (newImage !== project.image) {
      projectManager.updateProject(project.id, { image: newImage });
      fixedCount++;
    }

    usedImages.add(newImage);
  });

  loadProjectsTable();
  loadDashboardData();

  if (fixedCount > 0) {
    alert(`✅ Fixed ${fixedCount} projects with duplicate/broken images!`);
  } else {
    alert("✅ All projects already have unique images!");
  }
}

// Fix image paths to ensure consistency
function fixImagePaths() {
  if (
    !confirm(
      "🔧 This will normalize all image paths to use correct relative paths. Continue?"
    )
  ) {
    return;
  }

  let projects = projectManager.getAllProjects();
  let fixedCount = 0;

  projects.forEach((project) => {
    const originalPath = project.image;
    const normalizedPath = normalizeImagePath(originalPath);

    if (originalPath !== normalizedPath) {
      projectManager.updateProject(project.id, { image: normalizedPath });
      fixedCount++;
    }
  });

  loadProjectsTable();
  loadDashboardData();

  if (fixedCount > 0) {
    alert(`✅ Fixed ${fixedCount} projects with inconsistent image paths!`);
  } else {
    alert("✅ All projects already have correct image paths!");
  }
}

// Debug helper function
function debugStorage() {
  console.log("---------- ADMIN DEBUG -----------");
  // Check localStorage
  const localMessages = JSON.parse(
    localStorage.getItem("contact_messages") || "[]"
  );
  console.log("ADMIN - localStorage messages:", localMessages);

  // Check contactManager instance
  console.log(
    "ADMIN - contactManager available:",
    typeof contactManager !== "undefined"
  );

  if (typeof contactManager !== "undefined") {
    console.log(
      "ADMIN - contactManager methods:",
      Object.keys(contactManager).filter(
        (key) => typeof contactManager[key] === "function"
      )
    );

    contactManager
      .getAllMessages()
      .then((messages) => {
        console.log(
          "ADMIN - contactManager.getAllMessages() result:",
          messages
        );
      })
      .catch((err) => {
        console.error(
          "ADMIN - Error getting messages from contactManager:",
          err
        );
      });
  }
  console.log("----------------------------------");
}
