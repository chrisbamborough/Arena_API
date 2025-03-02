const projects = [
  { name: "Project 1", slug: "garden-studio" },
  { name: "Project 2", slug: "the-plan-gwqrwm65o1k" },
];

const blogChannel = "the-architects-measure-13xwa6qxgnk";
const radioChannel = "a-nomad-of-smooth-space";

let allContent = []; // Stores blog & radio posts
let projectBlocks = []; // Stores blocks of the currently opened project
let currentBlockIndex = 0; // Track block position

async function fetchAllContent() {
  allContent = [];

  // Fetch all projects (only their names, no blocks)
  const projectTitles = projects.map((proj) => ({
    id: proj.slug,
    title: proj.name,
    category: "project",
    project: proj.name,
  }));

  // Fetch blog and radio blocks
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

// Fetch channel data for blog and radio
async function fetchChannelData(slug, category, projectName) {
  try {
    const response = await fetch(`https://api.are.na/v2/channels/${slug}`);
    const data = await response.json();

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

// Display project titles & blog/radio posts
function displayTitles(contentList) {
  const listContainer = document.getElementById("content-list");
  listContainer.innerHTML = "";

  contentList.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${item.title} (${item.project || item.category})`;
    listItem.classList.add(item.category);

    if (item.category === "project") {
      listItem.addEventListener("click", () => openProjectModal(item.id));
    } else {
      listItem.addEventListener("click", () => openModal(item));
    }

    listContainer.appendChild(listItem);
  });
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
    } else {
      item.style.display = "none";
    }
  });
}

// Open project modal and fetch its blocks
async function openProjectModal(projectSlug) {
  try {
    const response = await fetch(
      `https://api.are.na/v2/channels/${projectSlug}`
    );
    const data = await response.json();
    projectBlocks = data.contents; // Store blocks
    currentBlockIndex = 0; // Reset index

    if (projectBlocks.length > 0) {
      showBlock(currentBlockIndex);
      document.getElementById("prev-arrow").style.display = "block";
      document.getElementById("next-arrow").style.display = "block";
      document.getElementById("modal").style.display = "flex";
    }
  } catch (error) {
    console.error(`Error fetching project ${projectSlug}:`, error);
  }
}

// Show a specific block inside the modal
function showBlock(index) {
  const block = projectBlocks[index];
  if (!block) return;

  const modalBody = document.getElementById("modal-body");
  let modalContent = "";

  if (block.image) {
    modalContent = `<img src="${block.image.original.url}" alt="Project Image">`;
  } else if (block.class === "Text") {
    modalContent = `<p>${block.content}</p>`;
  } else if (block.class === "Link") {
    modalContent = `<p><a href="${block.source.url}" target="_blank">${
      block.source.title || "View Link"
    }</a></p>`;
  }

  modalBody.innerHTML = modalContent;
}

// Navigate blocks inside the project modal
function changeBlock(direction) {
  currentBlockIndex += direction;
  if (currentBlockIndex < 0) currentBlockIndex = 0;
  if (currentBlockIndex >= projectBlocks.length)
    currentBlockIndex = projectBlocks.length - 1;
  showBlock(currentBlockIndex);
}

// Open modal for Blog and Radio posts (NO arrows)
function openModal(item) {
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");

  let modalContent = "";

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

  // Add description if available
  if (item.content.description) {
    modalContent += `<p class="description">${item.content.description}</p>`;
  }

  modalBody.innerHTML = `<h2>${item.title}</h2><p><strong>Category:</strong> ${
    item.project || item.category
  }</p>${modalContent}`;

  // Hide navigation arrows for blog/radio modals
  document.getElementById("prev-arrow").style.display = "none";
  document.getElementById("next-arrow").style.display = "none";

  modal.style.display = "flex";
}

// Close modal
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

// Handle modal navigation arrows
document
  .getElementById("prev-arrow")
  .addEventListener("click", () => changeBlock(-1));
document
  .getElementById("next-arrow")
  .addEventListener("click", () => changeBlock(1));

// Fetch initial data
fetchAllContent();
