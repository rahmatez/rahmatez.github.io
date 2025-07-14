/**
 * Display Blog Posts from localStorage on the blog page
 */

document.addEventListener("DOMContentLoaded", function () {
  // Make loadBlogsFromStorage accessible globally so it can be called from crud-blogs.js
  window.loadBlogsFromStorage = loadBlogsFromStorage;

  // Load blogs from storage when the page loads
  loadBlogsFromStorage();
});

function loadBlogsFromStorage() {
  // Get the blog posts container
  const blogPostsList = document.querySelector(".blog-posts-list");
  if (!blogPostsList) return;

  // Get blogs from localStorage
  const storageKey = "portfolio_blogs";
  const storedBlogs = localStorage.getItem(storageKey);

  try {
    // If there are blogs in localStorage, display them
    if (storedBlogs) {
      const blogs = JSON.parse(storedBlogs);

      if (blogs && blogs.length > 0) {
        // Sort blogs by date (newest first)
        const sortedBlogs = [...blogs].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Generate HTML for each blog post
        const blogPostsHTML = sortedBlogs
          .map((blog) => {
            // Format the date
            const blogDate = new Date(blog.date);

            // Get month and day for datetime attribute
            const month = blogDate.toLocaleString("en-US", { month: "short" });
            const day = blogDate.getDate();
            const year = blogDate.getFullYear();

            return `
            <li class="blog-post-item" data-dynamic="true">
              <a href="${blog.externalLink || "#"}">
                <figure class="blog-banner-box">
                  <img
                    src="${blog.image}"
                    alt="${blog.title}"
                    loading="lazy" />
                </figure>

                <div class="blog-content">
                  <div class="blog-meta">
                    <p class="blog-category">${blog.category}</p>
                    <span class="dot"></span>
                    <time datetime="${
                      blog.date
                    }">${month} ${day}, ${year}</time>
                  </div>

                  <h3 class="h3 blog-item-title">
                    ${blog.title}
                  </h3>

                  <p class="blog-text">
                    ${blog.content.substring(0, 150)}${
              blog.content.length > 150 ? "..." : ""
            }
                  </p>
                </div>
              </a>
            </li>
          `;
          })
          .join("");

        // Clear the list and add the dynamic content
        blogPostsList.innerHTML = blogPostsHTML;

        console.log(
          "Successfully displayed blogs from localStorage:",
          blogs.length
        );
        return; // Exit after successfully showing blogs
      }
    }

    // If we get here, there are no blogs in localStorage or the array is empty
    // Keep the default blog posts that are in the HTML
    console.log("Using default blog posts (no blogs in localStorage)");
  } catch (error) {
    console.error("Error loading blogs from localStorage:", error);
    // Keep the default blog posts in case of error
  }
}
