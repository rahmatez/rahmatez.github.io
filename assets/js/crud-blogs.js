/**
 * CRUD Operations for Blog Posts without Database
 * Using localStorage for persistence
 */

class BlogManager {
  constructor() {
    this.storageKey = "portfolio_blogs";
    this.blogs = this.loadBlogs();
  }

  // CREATE - Add new blog post
  createBlog(blogData) {
    const newBlog = {
      id: this.generateId(),
      title: blogData.title,
      category: blogData.category,
      image: blogData.image,
      content: blogData.content,
      externalLink: blogData.externalLink || "",
      date: blogData.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.blogs.push(newBlog);
    this.saveBlogs();
    return newBlog;
  }

  // READ - Get all blog posts
  getAllBlogs() {
    return this.blogs;
  }

  // READ - Get blog by ID
  getBlogById(id) {
    return this.blogs.find((blog) => blog.id === id);
  }

  // READ - Get blogs by category
  getBlogsByCategory(category) {
    if (category === "all") return this.blogs;
    return this.blogs.filter(
      (blog) => blog.category.toLowerCase() === category.toLowerCase()
    );
  }

  // UPDATE - Edit existing blog
  updateBlog(id, updatedData) {
    const blogIndex = this.blogs.findIndex((blog) => blog.id === id);

    if (blogIndex === -1) {
      throw new Error("Blog post not found");
    }

    this.blogs[blogIndex] = {
      ...this.blogs[blogIndex],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    this.saveBlogs();
    return this.blogs[blogIndex];
  }

  // DELETE - Remove blog
  deleteBlog(id) {
    const blogIndex = this.blogs.findIndex((blog) => blog.id === id);

    if (blogIndex === -1) {
      throw new Error("Blog post not found");
    }

    const deletedBlog = this.blogs.splice(blogIndex, 1)[0];
    this.saveBlogs();
    return deletedBlog;
  }

  // EXPORT - Export blogs to JSON file
  exportBlogs() {
    const dataStr = JSON.stringify(this.blogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "blogs-export.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  // IMPORT - Import blogs from JSON file
  importBlogs(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedBlogs = JSON.parse(event.target.result);

          // Validate data structure
          if (!Array.isArray(importedBlogs)) {
            throw new Error("Invalid data format. Expected an array of blogs.");
          }

          // Validate each blog
          importedBlogs.forEach((blog) => {
            if (!blog.title || !blog.category || !blog.image || !blog.content) {
              throw new Error("One or more blogs have invalid data structure.");
            }
          });

          // Replace or merge blogs
          this.blogs = importedBlogs;
          this.saveBlogs();
          resolve(this.blogs);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsText(file);
    });
  }

  // Helper - Generate unique ID
  generateId() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 5).toUpperCase()
    );
  }

  // Helper - Save blogs to localStorage
  saveBlogs() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.blogs));

    // Update the blog page if the blog-display script exists and we're in the blog page
    // This is needed for when blogs are added/edited from the admin panel
    if (typeof window.loadBlogsFromStorage === "function") {
      try {
        window.loadBlogsFromStorage();
        console.log("Blog display updated after saving blogs");
      } catch (e) {
        console.error("Could not update blog display:", e);
      }
    }
  }

  // Helper - Load blogs from localStorage
  loadBlogs() {
    const storedBlogs = localStorage.getItem(this.storageKey);
    return storedBlogs
      ? JSON.parse(storedBlogs)
      : [
          // Default blogs if none exist
          {
            id: "default1",
            title: "Getting to Know Rahmat Ashari",
            category: "Profile",
            image: "../assets/images/blog-profile1.jpg",
            content:
              "Hello, my name is Rahmat Ashari. I am a student at Telkom University Purwokerto, carving my path in a field I am deeply passionate about web development.",
            externalLink:
              "https://medium.com/@rahmatezdev/mengenal-rahmat-ashari-perjalanan-menuju-dunia-web-development-d6f37820b7a3",
            date: "2025-01-12T10:00:00.000Z",
            createdAt: "2025-01-12T10:00:00.000Z",
          },
          {
            id: "default2",
            title:
              "5 Reasons Why Web Development is a Promising Career in the Digital Era",
            category: "Web Development",
            image: "../assets/images/blog-2.jpg",
            content:
              "In today's digital age, nearly every aspect of life is connected to technology. From online shopping to social media, from banking to entertainment, everything runs on web platforms.",
            externalLink:
              "https://medium.com/@rahmatezdev/5-alasan-mengapa-web-development-menjadi-karir-yang-menjanjikan-di-era-digital-1ac898a6f866",
            date: "2025-01-12T10:00:00.000Z",
            createdAt: "2025-01-12T10:00:00.000Z",
          },
        ];
  }

  // Get statistics for dashboard
  getStats() {
    const categories = {};
    let totalCategories = 0;

    this.blogs.forEach((blog) => {
      if (!categories[blog.category]) {
        categories[blog.category] = 1;
        totalCategories++;
      } else {
        categories[blog.category]++;
      }
    });

    // Get recent blogs (last month)
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const recentBlogs = this.blogs.filter(
      (blog) => new Date(blog.createdAt) > oneMonthAgo
    ).length;

    return {
      total: this.blogs.length,
      totalCategories,
      categories,
      recentBlogs,
    };
  }
}

// Initialize blog manager
const blogManager = new BlogManager();
