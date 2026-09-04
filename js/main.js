/* ============================================
   Portfolio — dynamic renderer
   Fetches assets/data.json and builds the DOM
   ============================================ */

const ICON_BASE = "assets/icon/";

async function loadData() {
  const res = await fetch("assets/data.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data.json (" + res.status + ")");
  return res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c) node.appendChild(c);
  });
  return node;
}

function icon(iconFile, alt = "") {
  return el("img", { src: ICON_BASE + iconFile, alt, loading: "lazy" });
}

/* ---------- Renderers ---------- */

function renderNav(nav) {
  const wrap = document.getElementById("nav-links");
  if (!wrap) return;
  wrap.innerHTML = "";
  const currentPage = location.pathname.split("/").pop() || "index.html";
  nav.forEach((item) => {
    const isActive = item.href === currentPage;
    const link = el(
      "a",
      { class: "nav-link" + (isActive ? " is-active" : ""), href: item.href },
      [icon(item.icon, item.label), el("span", { text: item.label })],
    );
    wrap.appendChild(link);
  });
}

function renderProfile(status, profile) {
  const statusEl = document.getElementById("status-label");
  if (!statusEl) return; // page has no hero (e.g. experience.html, projects.html)
  statusEl.textContent = status;
  document.getElementById("hero-greeting").textContent = profile.greeting;
  document.getElementById("hero-role").textContent = profile.role;
  document.getElementById("hero-cta").textContent = profile.cta;
}

function renderContact(contact) {
  const wrap = document.getElementById("contact-list");
  if (!wrap) return;
  wrap.innerHTML = "";
  contact.forEach((c) => {
    const isMail = c.url.startsWith("mailto:");
    const external = c.url.startsWith("http");
    const labelSpan = el("span", { text: c.label });
    const item = el(
      "a",
      {
        class: "contact-item",
        href: c.url,
        ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
      },
      [el("span", { class: "icon-badge" }, icon(c.icon, c.label)), labelSpan],
    );

    if (isMail) {
      const email = c.url.replace(/^mailto:/, "");
      item.addEventListener("click", (e) =>
        copyEmailToClipboard(e, item, labelSpan, email, c.label),
      );
    }

    wrap.appendChild(item);
  });
}

function copyEmailToClipboard(e, item, labelSpan, email, originalLabel) {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    return; // clipboard API unavailable — let the mailto: link work normally
  }
  e.preventDefault();

  navigator.clipboard
    .writeText(email)
    .then(() => showCopiedFeedback(item, labelSpan, originalLabel))
    .catch(() => {
      // Clipboard write failed (e.g. permission denied) — fall back to mailto
      window.location.href = "mailto:" + email;
    });
}

function showCopiedFeedback(item, labelSpan, originalLabel) {
  clearTimeout(item._copyResetTimer);
  item.classList.add("is-copied");
  labelSpan.textContent = "Copied!";
  item._copyResetTimer = setTimeout(() => {
    item.classList.remove("is-copied");
    labelSpan.textContent = originalLabel;
  }, 1600);
}

function renderAbout(about) {
  const node = document.getElementById("about-text");
  if (!node) return;
  node.textContent = about;
}

function renderStacks(stacks) {
  const wrap = document.getElementById("stacks-grid");
  if (!wrap) return;
  wrap.innerHTML = "";
  stacks.forEach((s) => {
    const chip = el(
      "a",
      {
        class: "stack-chip",
        title: "Lihat project dengan " + s.name,
        href: "projects.html?tag=" + encodeURIComponent(s.name),
      },
      [icon(s.icon, s.name), el("span", { class: "stack-name", text: s.name })],
    );
    wrap.appendChild(chip);
  });
}

function renderExperience(experience) {
  const wrap = document.getElementById("exp-list");
  if (!wrap) return;
  wrap.innerHTML = "";
  experience.forEach((e) => {
    const card = el("div", { class: "info-card" }, [
      el("h3", { class: "info-card-title", text: e.role + " @ " + e.company }),
      el("p", { class: "info-card-period", text: e.period }),
      el("p", { class: "info-card-desc", text: e.description }),
    ]);
    wrap.appendChild(card);
  });
}

function renderEducation(education) {
  const wrap = document.getElementById("edu-list");
  if (!wrap) return;
  wrap.innerHTML = "";
  education.forEach((e) => {
    const card = el("div", { class: "info-card" }, [
      el("h3", { class: "info-card-title", text: e.degree + " @ " + e.school }),
      el("p", { class: "info-card-period", text: e.period }),
      el("p", { class: "info-card-desc", text: e.description }),
    ]);
    wrap.appendChild(card);
  });
}

const LOADING_GIF = "assets/pic/loading.gif";

function buildMediaBox(media, title) {
  const hasSrc = media.src && media.src.trim() !== "";

  if (!hasSrc) {
    return el("div", { class: "project-media" }, [
      el("p", {
        class: "project-media-placeholder",
        text: media.placeholder || "",
      }),
    ]);
  }

  const img = el("img", {
    class: "project-media-img",
    src: media.src,
    alt: media.alt || title,
  });

  const loadingText = el("p", { class: "loading-text", text: "LOADING" });
  const overlay = el("div", { class: "project-media-loading" }, [
    el("img", { class: "loading-avatar", src: LOADING_GIF, alt: "" }),
    loadingText,
  ]);

  const box = el("div", { class: "project-media" }, [img, overlay]);

  const markLoaded = () => box.classList.add("is-loaded");
  const markError = () => {
    box.classList.add("is-error");
    loadingText.textContent = "Gagal memuat gambar";
  };

  // If the browser already has it cached, "load" may have fired before we
  // attached the listener — check img.complete and skip straight to loaded.
  if (img.complete && img.naturalWidth > 0) {
    markLoaded();
  } else {
    img.addEventListener("load", markLoaded);
    img.addEventListener("error", markError);
  }

  return box;
}

function buildDescription(p) {
  const para = document.createElement("p");
  para.className = "project-block-desc";
  para.appendChild(document.createTextNode(p.description + " "));

  if (p.url) {
    const link = document.createElement("a");
    link.className = "project-github-link";
    link.href = p.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "The project is open source on Github.";
    para.appendChild(link);
  }

  return para;
}

function buildTagsRow(tags) {
  const pills = tags.map((t) =>
    el("span", { class: "project-tag" }, [
      icon(t.icon, ""),
      el("span", { text: t.name }),
    ]),
  );
  return el("div", { class: "project-tags-row" }, pills);
}

// function renderProjects(projects) {
//   const wrap = document.getElementById("projects-grid");
//   if (!wrap) return;
//   wrap.innerHTML = "";
//   projects.forEach((p) => {
//     const blockChildren = [
//       el("h3", { class: "project-block-title", text: p.title }),
//     ];

//     if (p.media) {
//       blockChildren.push(buildMediaBox(p.media, p.title));
//     }

//     blockChildren.push(buildDescription(p));

//     if (p.tags && p.tags.length) {
//       blockChildren.push(buildTagsRow(p.tags));
//     }

//     const block = el("article", { class: "project-block" }, blockChildren);
//     wrap.appendChild(block);
//   });
// }
function buildProjectBlock(p) {
  const blockChildren = [
    el("h3", { class: "project-block-title", text: p.title }),
  ];
  if (p.media) blockChildren.push(buildMediaBox(p.media, p.title));
  blockChildren.push(buildDescription(p));
  if (p.tags && p.tags.length) blockChildren.push(buildTagsRow(p.tags));
  return el("article", { class: "project-block" }, blockChildren);
}

function renderFilterBanner(activeTag, resultCount) {
  const filterWrap = document.getElementById("projects-filter");
  if (!filterWrap) return;
  filterWrap.innerHTML = "";
  if (!activeTag) return;

  const banner = el("div", { class: "filter-banner" }, [
    el("span", {
      class: "filter-banner-text",
      html: "Menampilkan " + resultCount + " project dengan stack " + activeTag,
    }),
    el("a", {
      class: "filter-clear",
      href: "projects.html",
      text: "Lihat semua project",
    }),
  ]);
  filterWrap.appendChild(banner);
}

function injectProjectsStructuredData(projects) {
  const existing = document.getElementById("projects-jsonld");
  if (existing) existing.remove();
  if (!projects.length) return;
 
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: p.title,
        description: p.description,
        ...(p.githubUrl ? { codeRepository: p.githubUrl, url: p.githubUrl } : {}),
        ...(p.tags && p.tags.length
          ? { keywords: p.tags.map((t) => t.name).join(", ") }
          : {}),
      },
    })),
  };
 
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "projects-jsonld";
  script.textContent = JSON.stringify(itemList);
  document.head.appendChild(script);
}

function renderProjects(projects) {
  const wrap = document.getElementById("projects-grid");
  if (!wrap) return;

  const activeTag = new URLSearchParams(location.search).get("tag");
  let list = projects;

  if (activeTag) {
    list = projects.filter((p) =>
      (p.tags || []).some(
        (t) => t.name.toLowerCase() === activeTag.toLowerCase(),
      ),
    );
  }

  renderFilterBanner(activeTag, list.length);
  wrap.innerHTML = "";

  if (activeTag && list.length === 0) {
    wrap.appendChild(
      el("p", {
        class: "projects-empty",
        text: "Belum ada project dengan stack “" + activeTag + "”.",
      }),
    );
    return;
  }

  list.forEach((p) => wrap.appendChild(buildProjectBlock(p)));
  
  if (!activeTag) injectProjectsStructuredData(projects);
}

function renderFooter(profile) {
  const node = document.getElementById("footer-text");
  if (!node) return;
  const year = new Date().getFullYear();
  node.textContent =
    "© " +
    year +
    " " +
    profile.greeting.replace("Halo, I'm ", "") +
    ". Built with HTML, CSS & JS.";
}

/* ---------- Hire Me modal ---------- */

function initHireModal() {
  const trigger = document.getElementById("hero-cta");
  const modal = document.getElementById("hire-modal");
  if (!trigger || !modal) return; 

  const openModal = () => {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      modal.hidden = true;
    }, 200);
  };

  trigger.addEventListener("click", openModal);

  modal.querySelectorAll("[data-modal-close]").forEach((node) => {
    node.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}

/* ---------- Boot ---------- */

async function init() {
  const app = document.getElementById("app");
  try {
    const data = await loadData();

    renderNav(data.nav);
    renderProfile(data.status, data.profile);
    renderContact(data.contact);
    renderAbout(data.about);
    renderStacks(data.stacks);
    renderExperience(data.experience);
    renderEducation(data.education);
    renderProjects(data.projects);
    renderFooter(data.profile);
    initHireModal();

    app.setAttribute("data-loading", "false");
  } catch (err) {
    console.error(err);
    app.innerHTML =
      '<div class="wrap" style="padding:3rem 0;">' +
      '<p style="color:#b91c1c;font-size:0.85rem;">Couldn\'t load portfolio data. ' +
      "If you opened this file directly (file://), run it through a local server instead " +
      "(e.g. <code>npx serve</code> or VS Code's Live Server) so the browser can fetch " +
      "<code>assets/data.json</code>.</p></div>";
  }
}

document.addEventListener("DOMContentLoaded", init);
