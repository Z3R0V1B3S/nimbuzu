/* =========================================================
   FILE: src/main.js
   NIMBUZU — application logic

   Storage schema (localStorage, key = CONFIG.storageKey):
   {
     theme: "dark" | "light",
     focusMode: boolean,
     searchEngine: "google" | "duckduckgo" | "bing",
     searchHistory: string[],
     background: { type: "preset" | "custom", value: string },
     tasks: [{ id, text, done }],
     note: string,
     customLinks: [{ id, name, url }]
   }

   Adding a default quick link: edit src/sites.js.
   Adding a settings control: see initSettings-style init*()
   functions below — each reads/writes one field on Storage
   and re-renders only what it owns.
========================================================= */

"use strict";

/* ---------------------------------------------------------
   Configuration
--------------------------------------------------------- */

const CONFIG = Object.freeze({
  storageKey: "nimbuzu",

  searchEngines: {
    google: {
      label: "Google Search",
      endpoint: "https://www.google.com/search",
      param: "q",
    },
    duckduckgo: {
      label: "DuckDuckGo",
      endpoint: "https://duckduckgo.com/",
      param: "q",
    },
    bing: {
      label: "Bing",
      endpoint: "https://www.bing.com/search",
      param: "q",
    },
  },

  searchHistoryLimit: 8,
  quickLinksOnHome: 8,

  parallax: {
    range: 24,
    ease: 0.08,
    resetDelay: 250,
  },

  // "image" values are plain paths, resolved against the document
  // (not the stylesheet) at runtime — see resolveAssetUrl() below.
  // "gradient" values are used as-is.
  backgroundPresets: {
    default: { type: "image", value: "assets/background3.jpg" },
    aurora: {
      type: "gradient",
      value: "linear-gradient(135deg, #1b2735, #0a3d62, #3c6382)",
    },
    sunset: {
      type: "gradient",
      value: "linear-gradient(135deg, #2c1250, #7d3c98, #f4a261)",
    },
    mono: { type: "gradient", value: "linear-gradient(135deg, #000, #2a2a2a)" },
  },
});

/* ---------------------------------------------------------
   DOM cache
--------------------------------------------------------- */

const DOM = {};

function cacheDom() {
  DOM.background = document.getElementById("background");

  DOM.topbarTime = document.getElementById("topbar-time");
  DOM.topbarDate = document.getElementById("topbar-date");
  DOM.heroTime = document.getElementById("hero-time");
  DOM.heroDate = document.getElementById("hero-date");
  DOM.greeting = document.getElementById("greeting");

  DOM.searchForm = document.getElementById("search-form");
  DOM.searchInput = document.getElementById("search-input");
  DOM.searchEngineLabel = document.getElementById("search-engine-label");

  DOM.quickLinks = document.getElementById("quick-links");
  DOM.sitesGrid = document.getElementById("sites-grid");
  DOM.linkFilterInput = document.getElementById("link-filter-input");
  DOM.linkAddForm = document.getElementById("link-add-form");
  DOM.linkAddName = document.getElementById("link-add-name");
  DOM.linkAddUrl = document.getElementById("link-add-url");

  DOM.taskPreview = document.getElementById("task-preview");
  DOM.taskListFull = document.getElementById("task-list-full");
  DOM.taskAddForm = document.getElementById("task-add-form");
  DOM.taskAddInput = document.getElementById("task-add-input");
  DOM.taskFilters = document.getElementById("task-filters");
  DOM.taskCountLabel = document.getElementById("task-count-label");
  DOM.clearCompleted = document.getElementById("clear-completed");
  DOM.addTaskShortcut = document.querySelector("[data-add-task]");

  DOM.calendarDay = document.getElementById("calendar-day");
  DOM.calendarMonth = document.getElementById("calendar-month");
  DOM.calendarYear = document.getElementById("calendar-year");
  DOM.weekDisplay = document.getElementById("week-display");

  DOM.quickNote = document.getElementById("quick-note");
  DOM.notesFull = document.getElementById("notes-full");
  DOM.notesStatus = document.getElementById("notes-status");
  DOM.notesClear = document.getElementById("notes-clear");

  DOM.themeSwitch = document.getElementById("theme-switch");
  DOM.engineSwitch = document.getElementById("engine-switch");
  DOM.bgOptions = document.getElementById("bg-options");
  DOM.bgCustomForm = document.getElementById("bg-custom-form");
  DOM.bgCustomUrl = document.getElementById("bg-custom-url");
  DOM.focusToggle = document.getElementById("focus-toggle");
  DOM.resetDataBtn = document.getElementById("reset-data-btn");

  DOM.status = document.getElementById("status");
  DOM.views = document.querySelectorAll(".view");
  DOM.navTargets = document.querySelectorAll("[data-view]");
}

/* ---------------------------------------------------------
   Storage
--------------------------------------------------------- */

const Storage = {
  read() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return {};
      const data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  },

  write(data) {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    } catch {
      // localStorage can be blocked under file:// in some browsers.
    }
  },

  update(callback) {
    const data = this.read();
    callback(data);
    this.write(data);
    return data;
  },
};

/* ---------------------------------------------------------
   Utilities
--------------------------------------------------------- */

const Utils = {
  escapeUrl(value) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  },

  uid() {
    return Math.random().toString(36).slice(2, 10);
  },

  isCoarsePointer() {
    return window.matchMedia("(pointer: coarse)").matches;
  },

  prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  },

  getTimeGreeting(hour) {
    if (hour < 6) return "Good night";
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  },

  /*
   * Resolves a relative path against the DOCUMENT's location
   * (index.html), not the stylesheet's.
   *
   * This matters specifically for CSS custom properties: a url()
   * baked into a custom property is resolved relative to the
   * stylesheet that consumes it (src/style.css) rather than the
   * document, even when the property was set from JS. Turning the
   * path into an absolute URL up front sidesteps that entirely.
   */
  resolveAssetUrl(relativePath) {
    return new URL(relativePath, document.baseURI).href;
  },
};

const FALLBACK_FAVICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
      '<rect width="64" height="64" rx="16" fill="#171a21"/>' +
      '<path d="M18 17h28v8H27v7h15v8H27v7h19v8H18V17z" fill="#ffffff"/>' +
      "</svg>",
  );

/* ---------------------------------------------------------
   Status bar
--------------------------------------------------------- */

let statusTimer = null;

function setStatus(message) {
  if (!DOM.status) return;
  DOM.status.textContent = message;
  window.clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => {
    DOM.status.textContent = "SYSTEM READY";
  }, 2200);
}

/* ---------------------------------------------------------
   View routing
--------------------------------------------------------- */

function showView(name) {
  DOM.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${name}`);
  });

  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === name);
  });

  if (name === "tasks") renderTaskListFull();
  if (name === "notes") syncNotesIntoFullView();
  if (name === "links") renderSitesGrid();
}

function initRouting() {
  DOM.navTargets.forEach((el) => {
    el.addEventListener("click", (event) => {
      const view = el.dataset.view;
      if (!view) return;
      event.preventDefault();
      showView(view);
    });
  });
}

/* ---------------------------------------------------------
   Clock + calendar
--------------------------------------------------------- */

function initClock() {
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long" });

  const update = () => {
    const now = new Date();
    const time = timeFormatter.format(now);
    const date = dateFormatter.format(now);

    DOM.topbarTime.textContent = time;
    DOM.topbarDate.textContent = date;
    DOM.heroTime.textContent = time;
    DOM.heroDate.textContent = date;
    DOM.greeting.textContent = Utils.getTimeGreeting(now.getHours());

    DOM.calendarDay.textContent = String(now.getDate());
    DOM.calendarMonth.textContent = monthFormatter.format(now);
    DOM.calendarYear.textContent = String(now.getFullYear());

    if (DOM.weekDisplay) {
      const today = now.getDay();
      DOM.weekDisplay.querySelectorAll("[data-dow]").forEach((span) => {
        span.classList.toggle("today", Number(span.dataset.dow) === today);
      });
    }

    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    window.setTimeout(update, Math.max(delay, 1000));
  };

  update();
}

/* ---------------------------------------------------------
   Search
--------------------------------------------------------- */

function getEngine() {
  const data = Storage.read();
  const key = data.searchEngine;
  return CONFIG.searchEngines[key] ? key : "google";
}

function applyEngineUI(key) {
  if (DOM.searchEngineLabel) {
    DOM.searchEngineLabel.textContent = CONFIG.searchEngines[key].label;
  }
  if (DOM.engineSwitch) {
    DOM.engineSwitch.querySelectorAll("[data-engine-value]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.engineValue === key);
    });
  }
}

function performSearch(query) {
  const value = query.trim();
  if (!value) {
    DOM.searchInput.focus();
    return;
  }

  Storage.update((data) => {
    const history = Array.isArray(data.searchHistory) ? data.searchHistory : [];
    const normalized = value.toLowerCase();
    const filtered = history.filter(
      (item) => item.toLowerCase() !== normalized,
    );
    filtered.unshift(value);
    data.searchHistory = filtered.slice(0, CONFIG.searchHistoryLimit);
  });

  const engineKey = getEngine();
  const engine = CONFIG.searchEngines[engineKey];
  const url = new URL(engine.endpoint);
  url.searchParams.set(engine.param, value);

  window.open(url.href, "_blank", "noopener,noreferrer");

  DOM.searchInput.value = "";
  setStatus("Search opened");
}

function initSearch() {
  DOM.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    performSearch(DOM.searchInput.value);
  });

  applyEngineUI(getEngine());

  if (DOM.engineSwitch) {
    DOM.engineSwitch.querySelectorAll("[data-engine-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.engineValue;
        Storage.update((data) => {
          data.searchEngine = key;
        });
        applyEngineUI(key);
        setStatus(`Search engine: ${CONFIG.searchEngines[key].label}`);
      });
    });
  }
}

/* ---------------------------------------------------------
   Keyboard shortcuts
--------------------------------------------------------- */

function initKeyboard() {
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      showView("home");
      DOM.searchInput.focus();
      return;
    }

    if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      showView("home");
      DOM.searchInput.focus();
      DOM.searchInput.select();
      return;
    }

    if (event.key === "Escape" && document.activeElement === DOM.searchInput) {
      DOM.searchInput.value = "";
      DOM.searchInput.blur();
      return;
    }

    if (event.key.toLowerCase() === "f" && !isTyping) {
      toggleFocusMode();
    }
  });
}

/* ---------------------------------------------------------
   Quick links / sites
--------------------------------------------------------- */

function getAllLinks() {
  const data = Storage.read();
  const custom = Array.isArray(data.customLinks) ? data.customLinks : [];
  // `sites` comes from src/sites.js, loaded before this file. It's a
  // top-level `const`, so it's NOT a window property — reference it
  // directly rather than via `window.sites`.
  const defaults =
    typeof sites !== "undefined" && Array.isArray(sites) ? sites : [];
  return { defaults, custom };
}

function buildLinkCard(site, { removable = false } = {}) {
  const url = Utils.escapeUrl(site.url);
  if (!url) return null;

  const card = document.createElement("a");
  card.className = "site";
  card.href = url.href;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute("role", "listitem");
  card.setAttribute("aria-label", site.name);

  const icon = document.createElement("img");
  icon.className = "site-icon";
  icon.width = 40;
  icon.height = 40;
  icon.alt = "";
  icon.loading = "lazy";
  icon.decoding = "async";
  icon.src =
    site.favicon ||
    `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
  icon.addEventListener("error", () => {
    if (icon.dataset.fallback === "true") return;
    icon.dataset.fallback = "true";
    icon.src = FALLBACK_FAVICON;
  });

  const content = document.createElement("span");
  content.className = "site-content";

  const label = document.createElement("span");
  label.className = "site-name";
  label.textContent = site.name;

  const domain = document.createElement("span");
  domain.className = "site-domain";
  domain.textContent = url.hostname.replace(/^www\./, "");

  content.append(label, domain);
  card.append(icon, content);

  if (removable) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "site-remove";
    remove.setAttribute("aria-label", `Remove ${site.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      Storage.update((data) => {
        data.customLinks = (data.customLinks || []).filter(
          (l) => l.id !== site.id,
        );
      });
      renderSitesGrid();
      renderQuickLinks();
      setStatus("Link removed");
    });
    card.appendChild(remove);
  }

  return card;
}

function renderQuickLinks() {
  if (!DOM.quickLinks) return;
  const { defaults, custom } = getAllLinks();
  const combined = [...custom, ...defaults].slice(0, CONFIG.quickLinksOnHome);

  DOM.quickLinks.replaceChildren();
  const fragment = document.createDocumentFragment();

  combined.forEach((site) => {
    const el = buildLinkCard(site);
    if (el) fragment.appendChild(el);
  });

  DOM.quickLinks.appendChild(fragment);
}

function renderSitesGrid() {
  if (!DOM.sitesGrid) return;
  const { defaults, custom } = getAllLinks();
  const query = (DOM.linkFilterInput?.value || "").trim().toLowerCase();

  const matches = (site) =>
    !query ||
    site.name.toLowerCase().includes(query) ||
    site.url.toLowerCase().includes(query);

  const combined = [
    ...custom.filter(matches).map((s) => ({ ...s, removable: true })),
    ...defaults.filter(matches).map((s) => ({ ...s, removable: false })),
  ];

  DOM.sitesGrid.replaceChildren();

  if (combined.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "No links match your filter.";
    DOM.sitesGrid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  combined.forEach((site) => {
    const el = buildLinkCard(site, { removable: site.removable });
    if (el) fragment.appendChild(el);
  });
  DOM.sitesGrid.appendChild(fragment);
}

function initLinks() {
  renderQuickLinks();

  if (DOM.linkFilterInput) {
    DOM.linkFilterInput.addEventListener("input", renderSitesGrid);
  }

  if (DOM.linkAddForm) {
    DOM.linkAddForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = DOM.linkAddName.value.trim();
      const urlValue = DOM.linkAddUrl.value.trim();
      const parsed = Utils.escapeUrl(urlValue);

      if (!name || !parsed) {
        setStatus("Enter a name and a valid URL");
        return;
      }

      Storage.update((data) => {
        const custom = Array.isArray(data.customLinks) ? data.customLinks : [];
        custom.unshift({ id: Utils.uid(), name, url: parsed.href });
        data.customLinks = custom;
      });

      DOM.linkAddName.value = "";
      DOM.linkAddUrl.value = "";
      renderSitesGrid();
      renderQuickLinks();
      setStatus("Link added");
    });
  }
}

/* ---------------------------------------------------------
   Tasks
--------------------------------------------------------- */

let taskFilter = "all";

function getTasks() {
  const data = Storage.read();
  return Array.isArray(data.tasks) ? data.tasks : [];
}

function setTasks(tasks) {
  Storage.update((data) => {
    data.tasks = tasks;
  });
}

function addTask(text) {
  const value = text.trim();
  if (!value) return;
  const tasks = getTasks();
  tasks.unshift({ id: Utils.uid(), text: value, done: false });
  setTasks(tasks);
  renderTaskPreview();
  renderTaskListFull();
  setStatus("Task added");
}

function toggleTask(id) {
  const tasks = getTasks().map((task) =>
    task.id === id ? { ...task, done: !task.done } : task,
  );
  setTasks(tasks);
  renderTaskPreview();
  renderTaskListFull();
}

function removeTask(id) {
  setTasks(getTasks().filter((task) => task.id !== id));
  renderTaskPreview();
  renderTaskListFull();
}

function buildTaskRow(task) {
  const row = document.createElement("label");
  row.className = "task-item" + (task.done ? " completed" : "");

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = task.done;
  input.addEventListener("change", () => toggleTask(task.id));

  const check = document.createElement("span");
  check.className = "task-check";

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  row.append(input, check, text);
  return row;
}

function renderTaskPreview() {
  if (!DOM.taskPreview) return;
  const tasks = getTasks().slice(0, 4);
  DOM.taskPreview.replaceChildren();

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "No tasks yet — add one below.";
    DOM.taskPreview.appendChild(empty);
    return;
  }

  tasks.forEach((task) => DOM.taskPreview.appendChild(buildTaskRow(task)));
}

function renderTaskListFull() {
  if (!DOM.taskListFull) return;
  const all = getTasks();
  const visible = all.filter((task) => {
    if (taskFilter === "active") return !task.done;
    if (taskFilter === "completed") return task.done;
    return true;
  });

  DOM.taskListFull.replaceChildren();

  if (visible.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hint";
    empty.textContent = "Nothing here.";
    DOM.taskListFull.appendChild(empty);
  } else {
    const fragment = document.createDocumentFragment();
    visible.forEach((task) => {
      const row = buildTaskRow(task);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "task-remove";
      remove.setAttribute("aria-label", `Remove task ${task.text}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => removeTask(task.id));

      row.appendChild(remove);
      fragment.appendChild(row);
    });
    DOM.taskListFull.appendChild(fragment);
  }

  const openCount = all.filter((t) => !t.done).length;
  DOM.taskCountLabel.textContent =
    openCount === 1 ? "1 task left" : `${openCount} tasks left`;
}

function initTasks() {
  renderTaskPreview();
  renderTaskListFull();

  if (DOM.taskAddForm) {
    DOM.taskAddForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addTask(DOM.taskAddInput.value);
      DOM.taskAddInput.value = "";
    });
  }

  if (DOM.addTaskShortcut) {
    DOM.addTaskShortcut.addEventListener("click", () => {
      showView("tasks");
      window.setTimeout(() => DOM.taskAddInput?.focus(), 50);
    });
  }

  if (DOM.taskFilters) {
    DOM.taskFilters.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        taskFilter = btn.dataset.filter;
        DOM.taskFilters.querySelectorAll("[data-filter]").forEach((b) => {
          b.classList.toggle("active", b === btn);
        });
        renderTaskListFull();
      });
    });
  }

  if (DOM.clearCompleted) {
    DOM.clearCompleted.addEventListener("click", () => {
      setTasks(getTasks().filter((task) => !task.done));
      renderTaskPreview();
      renderTaskListFull();
      setStatus("Completed tasks cleared");
    });
  }
}

/* ---------------------------------------------------------
   Notes
--------------------------------------------------------- */

let noteSaveTimer = null;

function saveNote(value) {
  Storage.update((data) => {
    data.note = value;
  });
  if (DOM.notesStatus) {
    DOM.notesStatus.textContent = "Saved";
    window.clearTimeout(noteSaveTimer);
    noteSaveTimer = window.setTimeout(() => {
      DOM.notesStatus.textContent = "Saved automatically";
    }, 1200);
  }
}

function syncNotesIntoFullView() {
  const data = Storage.read();
  if (DOM.notesFull) DOM.notesFull.value = data.note || "";
}

function initNotes() {
  const data = Storage.read();
  const initial = data.note || "";
  if (DOM.quickNote) DOM.quickNote.value = initial;
  if (DOM.notesFull) DOM.notesFull.value = initial;

  if (DOM.quickNote) {
    DOM.quickNote.addEventListener("input", () => {
      saveNote(DOM.quickNote.value);
      if (DOM.notesFull) DOM.notesFull.value = DOM.quickNote.value;
    });
  }

  if (DOM.notesFull) {
    DOM.notesFull.addEventListener("input", () => {
      saveNote(DOM.notesFull.value);
      if (DOM.quickNote) DOM.quickNote.value = DOM.notesFull.value;
    });
  }

  if (DOM.notesClear) {
    DOM.notesClear.addEventListener("click", () => {
      if (DOM.quickNote) DOM.quickNote.value = "";
      if (DOM.notesFull) DOM.notesFull.value = "";
      saveNote("");
      setStatus("Note cleared");
    });
  }
}

/* ---------------------------------------------------------
   Theme
--------------------------------------------------------- */

function getTheme() {
  const data = Storage.read();
  return data.theme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  if (DOM.themeSwitch) {
    DOM.themeSwitch.querySelectorAll("[data-theme-value]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeValue === theme);
    });
  }
}

function initTheme() {
  applyTheme(getTheme());

  if (DOM.themeSwitch) {
    DOM.themeSwitch.querySelectorAll("[data-theme-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.themeValue;
        Storage.update((data) => {
          data.theme = value;
        });
        applyTheme(value);
        setStatus(value === "light" ? "Light theme" : "Dark theme");
      });
    });
  }
}

/* ---------------------------------------------------------
   Background
--------------------------------------------------------- */

function applyBackground(background) {
  if (!DOM.background) return;

  // Sets only the --bg-image custom property (see style.css), so the
  // dark/light overlay gradient layered on top of it is never lost.
  if (background && background.type === "custom" && background.value) {
    // Custom URLs are already absolute (see initBackground / the form
    // handler), so they resolve the same regardless of context.
    DOM.background.style.setProperty(
      "--bg-image",
      `url("${background.value}")`,
    );
  } else {
    const key =
      background && CONFIG.backgroundPresets[background.value]
        ? background.value
        : "default";
    const preset = CONFIG.backgroundPresets[key];

    const cssValue =
      preset.type === "image"
        ? `url("${Utils.resolveAssetUrl(preset.value)}")`
        : preset.value;

    DOM.background.style.setProperty("--bg-image", cssValue);
  }

  if (DOM.bgOptions) {
    DOM.bgOptions.querySelectorAll("[data-bg]").forEach((btn) => {
      const isActive =
        background?.type !== "custom" &&
        btn.dataset.bg === (background?.value || "default");
      btn.classList.toggle("active", isActive);
    });
  }
}

function initBackground() {
  const data = Storage.read();
  applyBackground(data.background);

  if (DOM.bgOptions) {
    DOM.bgOptions.querySelectorAll("[data-bg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = { type: "preset", value: btn.dataset.bg };
        Storage.update((d) => {
          d.background = value;
        });
        applyBackground(value);
        setStatus("Background updated");
      });
    });
  }

  if (DOM.bgCustomForm) {
    DOM.bgCustomForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const url = DOM.bgCustomUrl.value.trim();
      const parsed = Utils.escapeUrl(url);
      if (!parsed) {
        setStatus("Enter a valid image URL");
        return;
      }
      const value = { type: "custom", value: parsed.href };
      Storage.update((d) => {
        d.background = value;
      });
      applyBackground(value);
      DOM.bgCustomUrl.value = "";
      setStatus("Background updated");
    });
  }
}

/* ---------------------------------------------------------
   Focus mode
--------------------------------------------------------- */

function toggleFocusMode() {
  const active = document.body.classList.toggle("focus-mode");

  Storage.update((data) => {
    data.focusMode = active;
  });

  if (DOM.focusToggle) {
    DOM.focusToggle.textContent = active ? "On" : "Off";
    DOM.focusToggle.setAttribute("aria-pressed", String(active));
  }

  setStatus(active ? "Focus mode on" : "Focus mode off");
}

function initFocusMode() {
  const data = Storage.read();
  const active = data.focusMode === true;

  document.body.classList.toggle("focus-mode", active);

  if (DOM.focusToggle) {
    DOM.focusToggle.textContent = active ? "On" : "Off";
    DOM.focusToggle.setAttribute("aria-pressed", String(active));
    DOM.focusToggle.addEventListener("click", toggleFocusMode);
  }
}

/* ---------------------------------------------------------
   Reset
--------------------------------------------------------- */

function initReset() {
  if (!DOM.resetDataBtn) return;

  DOM.resetDataBtn.addEventListener("click", () => {
    const confirmed = window.confirm(
      "This clears tasks, notes, custom links and preferences on this device. Continue?",
    );
    if (!confirmed) return;

    try {
      localStorage.removeItem(CONFIG.storageKey);
    } catch {
      // Ignore storage errors.
    }

    window.location.reload();
  });
}

/* ---------------------------------------------------------
   Parallax
--------------------------------------------------------- */

function initParallax() {
  if (Utils.prefersReducedMotion() || Utils.isCoarsePointer()) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frame = null;
  let resetTimer = null;

  const animate = () => {
    currentX += (targetX - currentX) * CONFIG.parallax.ease;
    currentY += (targetY - currentY) * CONFIG.parallax.ease;

    const x = currentX * CONFIG.parallax.range;
    const y = currentY * CONFIG.parallax.range;

    DOM.background.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.08)`;

    const distance =
      Math.abs(targetX - currentX) + Math.abs(targetY - currentY);
    frame = distance > 0.001 ? requestAnimationFrame(animate) : null;
  };

  const requestAnimation = () => {
    if (frame === null) frame = requestAnimationFrame(animate);
  };

  document.addEventListener(
    "mousemove",
    (event) => {
      targetX = event.clientX / window.innerWidth - 0.5;
      targetY = event.clientY / window.innerHeight - 0.5;

      requestAnimation();

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        targetX = 0;
        targetY = 0;
        requestAnimation();
      }, CONFIG.parallax.resetDelay);
    },
    { passive: true },
  );
}

/* ---------------------------------------------------------
   App
--------------------------------------------------------- */

function init() {
  cacheDom();

  initRouting();
  initClock();
  initSearch();
  initKeyboard();
  initTheme();
  initBackground();
  initFocusMode();
  initLinks();
  initTasks();
  initNotes();
  initReset();
  initParallax();

  setStatus("SYSTEM READY");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
