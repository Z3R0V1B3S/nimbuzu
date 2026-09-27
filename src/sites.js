/* =========================================================
   FILE: src/sites.js
   Default quick links shown on Home and in the Links view.

   Add an entry by pushing an object with { name, url } —
   favicon is optional; when omitted, main.js fetches one
   automatically and falls back to a generated icon if that
   fails. Links a person adds through the UI are stored
   separately in localStorage and merged in at render time,
   so this file only needs editing for the shipped defaults.
========================================================= */

"use strict";

const sites = [
  { name: "GitHub", url: "https://github.com/" },
  { name: "Google", url: "https://www.google.com/" },
  { name: "ChatGPT", url: "https://chatgpt.com/" },
  { name: "Claude", url: "https://claude.ai/" },
  { name: "YouTube", url: "https://www.youtube.com/" },
  { name: "MDN", url: "https://developer.mozilla.org/" },
  { name: "Vercel", url: "https://vercel.com/" },
  { name: "Figma", url: "https://figma.com/" },
  { name: "Notion", url: "https://notion.so/" },
  // { name: "Proton Mail", url: "https://mail.proton.me/" },
];
