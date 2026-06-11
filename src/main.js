// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

const CLOCK_LOCALE = "nl-NL";
const CLOCK_FORMAT = { hour: "2-digit", minute: "2-digit" };

function initClock() {
  const el = document.getElementById("clock");
  if (!el) return;

  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString(CLOCK_LOCALE, CLOCK_FORMAT);
    el.setAttribute("datetime", now.toISOString());

    const msUntilNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(tick, msUntilNextMinute);
  }

  tick();
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function initSearch() {
  const form = document.getElementById("search-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const input = document.getElementById("search");
    const query = input ? input.value.trim() : "";
    if (!query) return;

    const url = new URL("https://google.com/search");
    url.searchParams.set("q", query);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    input.value = "";
  });
}

// ---------------------------------------------------------------------------
// Sites grid
// ---------------------------------------------------------------------------

const FAVICON_API = "https://www.google.com/s2/favicons";
const FAVICON_SIZE = 64;
const SEEN_KEY = "favicon_seen";

function getSeenHosts() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
  } catch {
    return [];
  }
}

function markHostSeen(host) {
  try {
    var seen = getSeenHosts();
    if (!seen.includes(host)) {
      seen.push(host);
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    }
  } catch {
    // localStorage may be unavailable — silently ignore
  }
}

function initSites() {
  var container = document.getElementById("sites");
  if (!container) return;

  var fragment = document.createDocumentFragment();

  for (var i = 0; i < sites.length; i++) {
    var site = sites[i];
    var hostname;

    try {
      hostname = new URL(site.url).hostname;
    } catch {
      console.warn("[homestarter] Invalid URL skipped: " + site.url);
      continue;
    }

    var faviconUrl = new URL(FAVICON_API);
    faviconUrl.searchParams.set("domain", hostname);
    faviconUrl.searchParams.set("sz", String(FAVICON_SIZE));

    var a = document.createElement("a");
    a.className = "site";
    a.href = site.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("role", "listitem");
    a.setAttribute("aria-label", site.name);

    var img = document.createElement("img");
    img.alt = "";
    img.width = 48;
    img.height = 48;
    img.loading = "lazy";
    img.decoding = "async";
    img.src = faviconUrl.toString();

    // IIFE to capture hostname per iteration
    (function (h) {
      img.addEventListener(
        "load",
        function () {
          markHostSeen(h);
        },
        { once: true },
      );
    })(hostname);

    var span = document.createElement("span");
    span.textContent = site.name;

    a.appendChild(img);
    a.appendChild(span);
    fragment.appendChild(a);
  }

  container.appendChild(fragment);
}

// ---------------------------------------------------------------------------
// Parallax background
// ---------------------------------------------------------------------------

const PARALLAX_RANGE = 30;
const PARALLAX_SPEED_ACTIVE = 0.06;
const PARALLAX_SPEED_IDLE = 0.02;
const IDLE_THRESHOLD_MS = 2000;

function initParallax() {
  var bg = document.getElementById("background");
  if (!bg) return;

  var reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reducedMotion) return;

  var targetX = 0,
    targetY = 0;
  var currentX = 0,
    currentY = 0;
  var lastMove = 0;

  document.addEventListener("mousemove", function (e) {
    targetX = e.clientX / window.innerWidth - 0.5;
    targetY = e.clientY / window.innerHeight - 0.5;
    lastMove = performance.now();
  });

  function animate() {
    var idle = performance.now() - lastMove > IDLE_THRESHOLD_MS;
    var speed = idle ? PARALLAX_SPEED_IDLE : PARALLAX_SPEED_ACTIVE;

    currentX += (targetX - currentX) * speed;
    currentY += (targetY - currentY) * speed;

    var x = currentX * PARALLAX_RANGE;
    var y = currentY * PARALLAX_RANGE;

    bg.style.transform = "translate3d(" + x + "px, " + y + "px, 0) scale(1.1)";

    requestAnimationFrame(animate);
  }

  animate();
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  initClock();
  initSearch();
  initSites();
  initParallax();
});
