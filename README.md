# Z3R0V1B3S OS

A modern, lightweight browser start page and personal dashboard built with pure HTML, CSS, and JavaScript.

Z3R0V1B3S OS gives you a clean glass/Apple-inspired homepage with a live clock, web search, tasks, notes, quick links, calendar, themes, and customizable backgrounds.

Runs directly from a single `index.html` — no build step, server, or dependencies required.

![Z3R0V1B3S OS Screenshot](./assets/screenshot.png)

## Highlights

- Glassmorphism-inspired dashboard UI
- Home, Tasks, Notes, Links, and Settings views
- Live clock and real calendar date
- Google, DuckDuckGo, and Bing search support
- Custom quick links
- Add, complete, delete, and filter tasks
- Shared notes between Home and Notes
- Light and dark themes
- Multiple background presets
- Custom background image URL support
- Focus mode
- Responsive across desktop and mobile
- Local persistence with `localStorage`
- Zero dependencies
- No build tools required
- No backend required

## Getting Started

Clone the repository:

```bash
git clone https://github.com/Z3R0V1B3S/devhub.git
cd devhub
```

Open `index.html` in your browser.

To use Z3R0V1B3S OS as your homepage or new-tab page, point your browser (or a new-tab extension) to the local `index.html` file.

## Features

### Home

The Home dashboard provides a quick overview of your day:

- Live clock
- Date and calendar card
- Web search
- Task preview
- Quick note
- Quick links
- Focus mode

### Tasks

The Tasks view provides a simple local task manager.

- Add tasks
- Mark tasks as completed
- Delete tasks
- Filter by all, active, or completed
- Clear completed tasks
- Tasks stay synchronized with the Home dashboard

### Notes

The Home quick-note and full Notes view share the same saved note.

Your note is stored locally in the browser and remains available after restarting the page.

### Links

Quick links are loaded from `src/sites.js` by default.

You can also add your own links directly from the dashboard. Custom links are stored locally and can be deleted or filtered using the Links view.

### Settings

The Settings view includes:

- Dark / light theme
- Background presets
- Custom background image URL
- Search engine selection
- Focus mode
- Reset button

The reset option clears the data stored by Z3R0V1B3S OS on the current device.

## Customization

### Bookmarks

Edit `src/sites.js` to change the default quick links:

```js
const sites = [
  { name: "GitHub", url: "https://github.com" },
  { name: "ChatGPT", url: "https://chatgpt.com" },
];
```

### Background Image

The default background image is:

```text
assets/background3.jpg
```

Replace it with your own image or use the background settings inside the app.

### Page Title

The main title can be changed directly in `index.html`.

For example:

```html
<h2 class="title">Your Title</h2>
```

## Data Storage

Z3R0V1B3S OS does not currently use a backend.

Everything is stored locally in the browser using a single `localStorage` key:

```text
z3r0v1b3s
```

The stored data is represented as a single JSON object containing the application's local state.

The storage schema can be found in the comment at the top of:

```text
src/main.js
```

Because the data is local to the browser, it does not automatically synchronize between devices or browsers.

## Project Structure

```text
devhub/
├── assets/
│   ├── background3.jpg
│   ├── favicon-fallback.svg
│   └── screenshot.png
├── src/
│   ├── main.js
│   ├── sites.js
│   └── style.css
├── index.html
├── LICENSE
└── README.md
```

### Main files

| File                          | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `index.html`                  | Main markup and all dashboard views                 |
| `src/style.css`               | Complete styling, themes, glass effects, and layout |
| `src/main.js`                 | Application behavior and local state                |
| `src/sites.js`                | Default quick-link configuration                    |
| `assets/background3.jpg`      | Default background image                            |
| `assets/favicon-fallback.svg` | Fallback icon for links and the app                 |

## Browser Support

Z3R0V1B3S OS works in modern browsers, including:

- Chrome
- Firefox
- Edge
- Brave
- Arc
- Zen Browser

## What's New

Compared with the original DevHub start page, Z3R0V1B3S OS adds:

- Working navigation between Home, Tasks, Notes, Links, and Settings
- Full local task management
- Shared Home and Tasks state
- Shared Home and Notes state
- User-created quick links
- Link filtering and deletion
- Search engine selection
- Dark and light themes
- Background presets and custom backgrounds
- Focus mode
- Persistent local application state
- Real calendar date with today's date highlighted
- A complete glass dashboard interface

## Ideas for Future Upgrades

- **Drag-to-reorder** quick links and tasks using HTML5 drag events or a small library
- **PWA install support** with a `manifest.json` and service worker for HTTP(S) deployments
- **Import/export** for backing up tasks, notes, and links as JSON
- **Multiple task lists** instead of a single list
- **Multiple note pages** instead of a single note
- **Per-link custom icon uploads** instead of relying on favicon services
- **Optional sync backend** using something like Supabase or a shared Gist
- **Weather or RSS card** on the Home dashboard
- **More dashboard widgets** for additional customization

## Hosting

Z3R0V1B3S OS currently has no backend dependency and can be hosted as a static website.

Suitable options include:

- Netlify
- Vercel
- GitHub Pages

For local usage, simply opening `index.html` is enough.

If you add PWA functionality in the future, the app should be served over an HTTP(S) origin rather than directly from `file://`.

## License

Released under the MIT License.
