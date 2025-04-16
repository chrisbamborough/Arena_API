const projects = [
  { name: "Project 1", slug: "garden-studio" },
  { name: "Project 2", slug: "the-plan-gwqrwm65o1k" },
];

const blogChannel = "the-architects-measure-13xwa6qxgnk";
const radioChannel = "a-nomad-of-smooth-space";

let allContent = [];
let projectBlocks = [];
let currentBlockIndex = 0;

async function fetchAllContent() {
  allContent = [];

  const projectTitles = projects.map((proj) => ({
    id: proj.slug,
    title: proj.name,
    category: "project",
    project: proj.name,
  }));

  const blogPromise = fetchChannelData(blogChannel, "blog", "Blog");
  const radioPromise = fetchChannelData(radioChannel, "radio", "Radio");

  try {
    const results = await Promise.all([blogPromise, radioPromise]);
    allContent = [...projectTitles, ...results.flat()];
    displayTitles(allContent);
  } catch (error) {
    console.error("Error fetching Are.na data:", error);
  }
}

async function fetchChannelData(slug, category, projectName) {
  try {
    const response = await fetch(`https://api.are.na/v2/channels/${slug}`);
    const data = await response.json();

    // Log the contents of the blocks to the console for debugging
    console.log(`Data fetched for channel ${slug}:`, data.contents);

    return data.contents.map((block) => ({
      id: block.id,
      title: block.title || "Untitled",
      type: block.class.toLowerCase(),
      category: category,
      project: projectName,
      content: block,
    }));
  } catch (error) {
    console.error(`Error fetching ${slug}:`, error);
    return [];
  }
}

function displayTitles(contentList) {
  const listContainer = document.getElementById("content-list");
  listContainer.innerHTML = "";

  contentList.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item.title;
    listItem.classList.add(item.category);

    // Store image URL in data attribute for grid view
    if (item.content && item.content.image) {
      listItem.setAttribute("data-image-url", item.content.image.original.url);
    }

    const thumbnail = document.createElement("img");
    thumbnail.classList.add("hover-thumbnail");
    thumbnail.style.display = "none";

    if (item.category === "project") {
      fetchProjectImage(item.id, thumbnail, listItem);
    } else if (item.content && item.content.image) {
      thumbnail.src = item.content.image.original.url;
    }

    listContainer.appendChild(listItem);
    document.body.appendChild(thumbnail);

    // Only add hover events for list view (not grid view)
    const isGridView = listContainer.classList.contains("grid-view");
    if (!isGridView) {
      listItem.addEventListener("mouseenter", () => {
        thumbnail.style.display = "block";
      });

      listItem.addEventListener("mouseleave", () => {
        thumbnail.style.display = "none";
      });

      listItem.addEventListener("mousemove", (event) => {
        const thumbnailHeight = thumbnail.offsetHeight;
        const windowHeight = window.innerHeight;
        let topPosition = event.pageY - thumbnailHeight / 2;

        // Ensure the thumbnail does not go off the top or bottom of the screen
        if (topPosition < 0) {
          topPosition = 0;
        } else if (topPosition + thumbnailHeight > windowHeight) {
          topPosition = windowHeight - thumbnailHeight;
        }

        thumbnail.style.left = `${event.pageX + 10}px`;
        thumbnail.style.top = `${topPosition}px`;
      });
    }

    // Store reference to thumbnail for this list item
    listItem._thumbnail = thumbnail;
    thumbnail._associatedItem = listItem;

    if (item.category === "project") {
      listItem.addEventListener("click", () => openProjectModal(item.id));
    } else {
      listItem.addEventListener("click", () => openModal(item));
    }
  });

  // If we're already in grid view, apply grid view styles
  if (listContainer.classList.contains("grid-view")) {
    applyGridView();
  }
}

async function fetchProjectImage(projectSlug, thumbnailElement, listItem) {
  try {
    const response = await fetch(
      `https://api.are.na/v2/channels/${projectSlug}`
    );
    const data = await response.json();
    const firstImageBlock = data.contents.find((block) => block.image);

    if (firstImageBlock) {
      thumbnailElement.src = firstImageBlock.image.original.url;

      // Store image URL in data attribute for grid view
      if (listItem) {
        listItem.setAttribute(
          "data-image-url",
          firstImageBlock.image.original.url
        );
      }
    }
  } catch (error) {
    console.error(`Error fetching image for ${projectSlug}:`, error);
  }
}

function filterTitles() {
  const query = document.getElementById("search-bar").value.toLowerCase();
  const items = document.querySelectorAll("#content-list li");

  items.forEach((item) => {
    if (item.textContent.toLowerCase().includes(query)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

function filterByCategory(category) {
  const items = document.querySelectorAll("#content-list li");

  items.forEach((item) => {
    if (category === "all" || item.classList.contains(category)) {
      item.style.display = "block";
      item.classList.add("block");
    } else {
      item.style.display = "none";
      item.classList.remove("block");
    }
  });
}

function setView(view) {
  const listContainer = document.getElementById("content-list");

  if (view === "grid") {
    listContainer.classList.add("grid-view");
    applyGridView();
  } else {
    listContainer.classList.remove("grid-view"); // removes grid styles
    resetToListView();
  }
}

// Function to apply grid view appearance
function applyGridView() {
  const listItems = document.querySelectorAll("#content-list li");

  listItems.forEach((item) => {
    // Store the original text content
    const originalText = item.textContent;
    item.setAttribute("data-title", originalText);

    // Clear the text content
    item.textContent = "";

    // Create an image element for grid view
    const img = document.createElement("img");
    img.classList.add("grid-image");

    // Get the image URL from the data attribute
    const imageUrl = item.getAttribute("data-image-url");

    if (imageUrl) {
      img.src = imageUrl;
    } else if (item._thumbnail && item._thumbnail.src) {
      // Fallback to the hover thumbnail if available
      img.src = item._thumbnail.src;
    }

    // If no image found or loaded, show a placeholder with the title
    img.onerror = () => {
      item.textContent = originalText;
    };

    item.appendChild(img);

    // Hide the hover thumbnail for grid view
    if (item._thumbnail) {
      item._thumbnail._gridMode = true;
    }
  });
}

// Function to reset to list view appearance
function resetToListView() {
  const listItems = document.querySelectorAll("#content-list li");

  listItems.forEach((item) => {
    // Get the stored title
    const originalText = item.getAttribute("data-title");

    // Remove any images
    const images = item.querySelectorAll(".grid-image");
    images.forEach((img) => img.remove());

    // Restore the text
    if (originalText) {
      item.textContent = originalText;
    }

    // Re-enable hover thumbnails
    if (item._thumbnail) {
      item._thumbnail._gridMode = false;
    }
  });
}

async function openProjectModal(projectSlug) {
  try {
    const response = await fetch(
      `https://api.are.na/v2/channels/${projectSlug}`
    );
    const data = await response.json();
    projectBlocks = data.contents;

    if (projectBlocks.length > 0) {
      showAllBlocks(projectBlocks);
      document.getElementById("modal").style.display = "flex";
    }
  } catch (error) {
    console.error(`Error fetching project ${projectSlug}:`, error);
  }
}

function showAllBlocks(blocks) {
  const modalBody = document.getElementById("modal-body");
  let modalContent = "";

  blocks.forEach((block) => {
    if (block.image) {
      modalContent += `<div class="block full-width"><img src="${block.image.original.url}" alt="Project Image"></div>`;
    } else if (block.class === "Text") {
      modalContent += `<div class="block full-width"><p>${block.content}</p></div>`;
    } else if (block.class === "Link") {
      modalContent += `<div class="block full-width"><p><a href="${
        block.source.url
      }" target="_blank">${block.source.title || "View Link"}</a></p></div>`;
    }
  });

  modalBody.innerHTML = modalContent;

  // Hide the arrows
  document.getElementById("prev-arrow").style.display = "none";
  document.getElementById("next-arrow").style.display = "none";
}

function changeBlock(direction) {
  currentBlockIndex += direction;
  if (currentBlockIndex < 0) currentBlockIndex = 0;
  if (currentBlockIndex >= projectBlocks.length)
    currentBlockIndex = projectBlocks.length - 1;
  showBlock(currentBlockIndex);
}

function openModal(item) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  // Log the item being processed for debugging
  console.log("Opening modal for item:", item);

  let modalContent = "";

  // Check if the block contains a SoundCloud URL and is of type media
  if (
    item.type === "media" &&
    item.content.source &&
    item.content.source.url.includes("soundcloud.com")
  ) {
    const soundCloudUrl = item.content.source.url;
    modalContent += `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(
      soundCloudUrl
    )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe>`;
  } else {
    if (item.content.image) {
      modalContent += `<img src="${item.content.image.original.url}" alt="Image">`;
    }
    if (item.type === "text") {
      modalContent += `<p>${item.content.content}</p>`;
    }
    if (item.type === "link" && item.content.source) {
      modalContent += `<p><a href="${
        item.content.source.url
      }" target="_blank" rel="noopener noreferrer">
              ${item.content.source.title || "View Link"}
          </a></p>`;
    }
    if (item.content.description) {
      modalContent += `<p class="description">${item.content.description}</p>`;
    }
  }

  modalBody.innerHTML = `<h2>${item.title}</h2>
    <p><strong>Category:</strong> ${item.project || item.category}</p>
    ${modalContent}`;

  document.getElementById("prev-arrow").style.display = "none";
  document.getElementById("next-arrow").style.display = "none";
  modal.style.display = "flex";
}

document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

document
  .getElementById("prev-arrow")
  .addEventListener("click", () => changeBlock(-1));
document
  .getElementById("next-arrow")
  .addEventListener("click", () => changeBlock(1));

document.addEventListener("click", (event) => {
  const expandedImage = document.querySelector(".expanded-image");

  // Close the expanded image if clicking outside of it
  if (expandedImage && !event.target.classList.contains("expanded-image")) {
    expandedImage.classList.remove("expanded-image");
    expandedImage.classList.add("modal-image");
  }

  // Toggle the expanded-image class when clicking on an image
  if (event.target.tagName === "IMG" && event.target.closest("#modal-body")) {
    const img = event.target;

    if (img.classList.contains("expanded-image")) {
      img.classList.remove("expanded-image");
      img.classList.add("modal-image");
    } else {
      img.classList.remove("modal-image");
      img.classList.add("expanded-image");
    }
  }
});

document.addEventListener("keydown", (event) => {
  const expandedImage = document.querySelector(".expanded-image");

  // Close the expanded image when pressing the Escape key
  if (event.key === "Escape" && expandedImage) {
    expandedImage.classList.remove("expanded-image");
    expandedImage.classList.add("modal-image");
  }

  const modal = document.getElementById("modal");

  // Close the modal when pressing the Escape key
  if (event.key === "Escape" && modal.style.display === "flex") {
    modal.style.display = "none";
  }
});

// Fetch initial data
fetchAllContent();
