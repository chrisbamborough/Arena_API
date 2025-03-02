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

    const thumbnail = document.createElement("img");
    thumbnail.classList.add("hover-thumbnail");
    thumbnail.style.display = "none";

    if (item.category === "project") {
      fetchProjectImage(item.id, thumbnail);
    } else if (item.content && item.content.image) {
      thumbnail.src = item.content.image.original.url;
    }

    listContainer.appendChild(listItem);
    document.body.appendChild(thumbnail);

    listItem.addEventListener("mouseenter", () => {
      thumbnail.style.display = "block";
    });

    listItem.addEventListener("mouseleave", () => {
      thumbnail.style.display = "none";
    });

    listItem.addEventListener("mousemove", (event) => {
      thumbnail.style.left = `${event.pageX + 10}px`;
      thumbnail.style.top = `${event.pageY + 10}px`;
    });

    if (item.category === "project") {
      listItem.addEventListener("click", () => openProjectModal(item.id));
    } else {
      listItem.addEventListener("click", () => openModal(item));
    }
  });
}

async function fetchProjectImage(projectSlug, thumbnailElement) {
  try {
    const response = await fetch(
      `https://api.are.na/v2/channels/${projectSlug}`
    );
    const data = await response.json();
    const firstImageBlock = data.contents.find((block) => block.image);

    if (firstImageBlock) {
      thumbnailElement.src = firstImageBlock.image.original.url;
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
    } else {
      item.style.display = "none";
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
    currentBlockIndex = 0;

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
  if (item.content.description) {
    modalContent += `<p class="description">${item.content.description}</p>`;
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

// Fetch initial data
fetchAllContent();
