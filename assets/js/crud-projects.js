/**
 * CRUD Operations for Projects without Database
 * Using localStorage for persistence
 */

class ProjectManager {
  constructor() {
    this.storageKey = "portfolio_projects";
    this.projects = this.loadProjects();
  }

  // CREATE - Add new project
  createProject(projectData) {
    const newProject = {
      id: this.generateId(),
      title: projectData.title,
      category: projectData.category,
      image: projectData.image,
      description: projectData.description,
      technologies: projectData.technologies || [],
      link: projectData.link || "",
      createdAt: new Date().toISOString(),
    };

    this.projects.push(newProject);
    this.saveProjects();
    return newProject;
  }

  // READ - Get all projects
  getAllProjects() {
    return this.projects;
  }

  // READ - Get project by ID
  getProjectById(id) {
    return this.projects.find((project) => project.id === id);
  }

  // READ - Get projects by category
  getProjectsByCategory(category) {
    if (category === "all") return this.projects;
    return this.projects.filter(
      (project) => project.category.toLowerCase() === category.toLowerCase()
    );
  }

  // UPDATE - Edit existing project
  updateProject(id, updatedData) {
    const projectIndex = this.projects.findIndex(
      (project) => project.id === id
    );

    if (projectIndex === -1) {
      throw new Error("Project not found");
    }

    this.projects[projectIndex] = {
      ...this.projects[projectIndex],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    this.saveProjects();
    return this.projects[projectIndex];
  }

  // DELETE - Remove project
  deleteProject(id) {
    const projectIndex = this.projects.findIndex(
      (project) => project.id === id
    );

    if (projectIndex === -1) {
      throw new Error("Project not found");
    }

    const deletedProject = this.projects.splice(projectIndex, 1)[0];
    this.saveProjects();
    return deletedProject;
  }

  // EXPORT - Export projects to JSON file
  exportProjects() {
    const dataStr = JSON.stringify(this.projects, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "projects-export.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  // IMPORT - Import projects from JSON file
  importProjects(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProjects = JSON.parse(e.target.result);

          // Validate imported data
          if (!Array.isArray(importedProjects)) {
            throw new Error("Invalid file format");
          }

          // Add imported projects
          importedProjects.forEach((project) => {
            if (project.title && project.category) {
              // Generate new ID to avoid conflicts
              project.id = this.generateId();
              project.createdAt = project.createdAt || new Date().toISOString();
              this.projects.push(project);
            }
          });

          this.saveProjects();
          resolve(importedProjects.length);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  // UTILITY - Get project statistics
  getStats() {
    const stats = {
      total: this.projects.length,
      categories: {},
      recent: this.projects.filter((p) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(p.createdAt) > oneWeekAgo;
      }).length,
    };

    // Count by category
    this.projects.forEach((project) => {
      const category = project.category || "uncategorized";
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    return stats;
  }

  // INITIALIZE - Initialize default projects with correct image paths
  initializeDefaultProjects() {
    const defaultProjects = [
      {
        id: this.generateId(),
        title: "Finance",
        category: "web development",
        image: "../assets/images/project-1.jpg",
        description:
          "A comprehensive finance management application built with modern web technologies.",
        technologies: ["HTML", "CSS", "JavaScript", "Chart.js"],
        link: "github.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: this.generateId(),
        title: "Orizon",
        category: "web development",
        image: "../assets/images/project-2.png",
        description:
          "Modern web application with clean design and smooth user experience.",
        technologies: ["React", "Node.js", "MongoDB"],
        link: "https://orizon-demo.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: this.generateId(),
        title: "Fundo",
        category: "web design",
        image: "../assets/images/project-3.jpg",
        description:
          "Creative funding platform with innovative design and user-friendly interface.",
        technologies: ["Figma", "Adobe XD", "Sketch"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
      {
        id: this.generateId(),
        title: "Brawlhalla",
        category: "ui/ux design",
        image: "../assets/images/project-4.png",
        description:
          "Gaming interface design with interactive elements and modern aesthetics.",
        technologies: ["Adobe XD", "Photoshop"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
      {
        id: this.generateId(),
        title: "DSM",
        category: "web development",
        image: "../assets/images/project-5.png",
        description:
          "Design system management platform for scalable design workflows.",
        technologies: ["Vue.js", "TypeScript", "Storybook"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
    ];

    this.projects = defaultProjects;
    this.saveProjects();
    return defaultProjects;
  }

  // CHECK - Check and auto-initialize if no projects exist
  ensureDefaultProjects() {
    if (this.projects.length === 0) {
      return this.initializeDefaultProjects();
    }
    return this.projects;
  }

  // Helper methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  loadProjects() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultProjects();
    } catch (error) {
      console.error("Error loading projects:", error);
      return this.getDefaultProjects();
    }
  }

  saveProjects() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.projects));
    } catch (error) {
      console.error("Error saving projects:", error);
    }
  }

  getDefaultProjects() {
    return [
      {
        id: "1",
        title: "Finance",
        category: "web development",
        image: "../assets/images/project-1.jpg",
        description:
          "Modern finance dashboard with analytics and reporting features",
        technologies: ["HTML", "CSS", "JavaScript", "Chart.js"],
        link: "github.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Orizon",
        category: "web development",
        image: "../assets/images/project-2.png",
        description: "Sleek web application with modern UI/UX design",
        technologies: ["React", "Node.js", "MongoDB"],
        link: "https://orizon-demo.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        title: "Fundo",
        category: "web design",
        image: "../assets/images/project-3.jpg",
        description: "Creative funding platform with innovative design",
        technologies: ["Figma", "Adobe XD", "Sketch"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        title: "Brawlhalla",
        category: "ui/ux design",
        image: "../assets/images/project-4.png",
        description: "Gaming interface design with interactive elements",
        technologies: ["Adobe XD", "Photoshop"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
      {
        id: "5",
        title: "DSM",
        category: "web development",
        image: "../assets/images/project-5.png",
        description: "Design system management platform",
        technologies: ["Vue.js", "TypeScript", "Storybook"],
        link: "#",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

// Smart image error handler with unique fallbacks
function handleImageError(imgElement, projectId) {
  // Array of fallback images
  const fallbackImages = [
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

  // Use project ID to consistently select the same fallback for the same project
  const hash = projectId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const fallbackIndex = Math.abs(hash) % fallbackImages.length;
  const fallbackImage = fallbackImages[fallbackIndex];

  // Set fallback image and prevent infinite loop
  imgElement.src = fallbackImage;
  imgElement.onerror = function () {
    // Last resort: show a placeholder or hide the image
    this.style.background = "#333";
    this.alt = "🖼️ Image not available";
    this.style.display = "flex";
    this.style.alignItems = "center";
    this.style.justifyContent = "center";
    this.style.color = "#fff";
    this.style.fontSize = "2rem";
    this.innerHTML = "🖼️";
    this.onerror = null;
  };
}

// Initialize project manager
const projectManager = new ProjectManager();

// Example usage functions
function displayProjects(category = "all") {
  const projects = projectManager.getProjectsByCategory(category);
  const projectList = document.querySelector(".project-list");

  if (!projectList) return;

  projectList.innerHTML = projects
    .map(
      (project) => `
    <li class="project-item active" data-filter-item data-category="${
      project.category
    }">
      <a href="${project.link || "#"}">
        <figure class="project-img">
          <div class="project-item-icon-box">
            <ion-icon name="eye-outline"></ion-icon>
          </div>
          <img src="${project.image}" 
               alt="${project.title}" 
               loading="lazy" 
               onerror="handleImageError(this, '${project.id}')"
               style="width: 100%; height: 200px; object-fit: cover;" />
        </figure>
        <h3 class="project-title">${project.title}</h3>
        <p class="project-category">${project.category}</p>
      </a>
    </li>
  `
    )
    .join("");
}

// Admin functions (for development/management) - Protected by authentication
function addProject() {
  // Check if user is authenticated
  if (!window.authManager || !window.authManager.isLoggedIn()) {
    if (window.authManager) {
      window.authManager.showLogin();
    } else {
      alert("Authentication required. Please login to add projects.");
    }
    return;
  }

  const projectData = {
    title: prompt("Project Title:"),
    category: prompt("Category (web development/web design/ui/ux design):"),
    image: prompt("Image path:"),
    description: prompt("Description:"),
    technologies: prompt("Technologies (comma separated):").split(","),
    link: prompt("Project link:"),
  };

  if (projectData.title && projectData.category) {
    const newProject = projectManager.createProject(projectData);
    console.log("Project created:", newProject);
    displayProjects();
  }
}

function editProject(id) {
  // Check if user is authenticated
  if (!window.authManager || !window.authManager.isLoggedIn()) {
    if (window.authManager) {
      window.authManager.showLogin();
    } else {
      alert("Authentication required. Please login to edit projects.");
    }
    return;
  }

  const project = projectManager.getProjectById(id);
  if (!project) return;

  const updatedData = {
    title: prompt("Project Title:", project.title) || project.title,
    category: prompt("Category:", project.category) || project.category,
    description:
      prompt("Description:", project.description) || project.description,
  };

  const updated = projectManager.updateProject(id, updatedData);
  console.log("Project updated:", updated);
  displayProjects();
}

function deleteProject(id) {
  // Check if user is authenticated
  if (!window.authManager || !window.authManager.isLoggedIn()) {
    if (window.authManager) {
      window.authManager.showLogin();
    } else {
      alert("Authentication required. Please login to delete projects.");
    }
    return;
  }

  if (confirm("Are you sure you want to delete this project?")) {
    const deleted = projectManager.deleteProject(id);
    console.log("Project deleted:", deleted);
    displayProjects();
  }
}

// Search functionality
function searchProjects(query) {
  const allProjects = projectManager.getAllProjects();
  const filtered = allProjects.filter(
    (project) =>
      project.title.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase()) ||
      project.category.toLowerCase().includes(query.toLowerCase())
  );

  return filtered;
}

// Export for global use
window.projectManager = projectManager;
window.displayProjects = displayProjects;
window.addProject = addProject;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.searchProjects = searchProjects;
