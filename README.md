# AetherTodo — Secure, Local-First Productivity Dashboard

A modern, highly secure, and feature-rich productivity dashboard that puts privacy first. Built with pure vanilla technologies (HTML5, Vanilla CSS, and JavaScript), **AetherTodo** secures your tasks, notes, and checklists directly inside your browser using military-grade cryptography.

#### 🌐 Live Demo: [https://saikoful.github.io/todo/](https://saikoful.github.io/todo/)
#### Available in: [🇷🇺 Russian](README_RU.md) | [🇺🇦 Ukrainian](README_UA.md)

---

## Key Features

### 🛡️ Zero-Knowledge Security & Cryptography
*   **Master Password Lock**: Your tasks are locked when you leave. Upon first launch, you establish a Master Password.
*   **AES-GCM 256-bit Encryption**: All task data, subtasks, category tags, and settings are encrypted on-the-fly using AES-GCM.
*   **PBKDF2 Key Derivation**: Encryption keys are derived locally using PBKDF2 with 100,000 iterations of SHA-256 and a cryptographically secure random salt.
*   **Auto-Lock Timer**: Adjustable session timeouts (1m, 5m, 15m, 30m, or never) automatically wipe sensitive in-memory data and lock the UI after user inactivity.
*   **Zero Server Communication**: Your password and data are strictly local and never transmitted anywhere.

### 🍅 Productivity Widgets
*   **Pomodoro Timer**: An SVG radial ring countdown timer. Toggle between Work (25 min), Short Break (5 min), and Long Break (15 min). Completed cycles are tracked automatically.
*   **Analytics Panel**: Dynamic completion statistics including a circular progress visualizer and total/completed/pending task counters.
*   **Live Weather Forecast**: Integrates the keyless Open-Meteo Geocoding and Weather API. Enter any city name to retrieve active weather reports, with an automated fallback to simulated conditions if offline.
*   **Inspirational Quotes**: Generates daily wisdom quotes fetched from a public API, with a local curated fallback list.

### 🎵 Premium Aesthetics & Sound Integration
*   **Aesthetic Ambient Player**: Includes controls for background music (`files/song.mp3`) with a spinning vinyl disk animation and dynamic soundwave bars that dance in sync with the audio track.
*   **Volume Accordion**: A space-saving volume slider that expands smoothly on hovering over the sound icon.
*   **Synthesized Audio Chimes**: Utilizes the browser's native **Web Audio API** to synthesize beautiful chimes for task completions and Pomodoro notifications without requiring heavy audio assets.
*   **Animated Glassmorphism**: Stunning UI panels with backdrop filters, smooth hover transformations, and slowly drifting animated glowing orbs in the background.

### 📝 Advanced Task Management (CRUD)
*   **Advanced Form Options**: Expand priority tags, categories, and due dates under a collapsible details panel.
*   **Detailed Notes & Checklist**: Expand cards to add multi-line descriptions (auto-saved on blur) and manage detailed checkpoints/subtasks.
*   **Search, Filter & Sort**: Live search across titles and notes; filter by status (All, Active, Completed); sort by Creation Date, Due Date, or Priority weight.
*   **Encrypted backups**: Export your entire vault as an encrypted JSON backup file (requiring your password to restore) or a plain text list.

---

## Screenshots

### 1. Main Unlocked Dashboard
The space-optimized glassmorphic workspace displaying analytics, weather, Pomodoro timer, music player, and active tasks.
![AetherTodo Dashboard](files/dashboard.png)

### 2. Task Details & Subtasks Checklist
Double-click task titles to edit them inline, or expand them to manage notes and check off subtasks.
![AetherTodo Task Details](files/details.png)

---

## Tech Stack
*   **Markup**: HTML5 Semantic Structure
*   **Styling**: Vanilla CSS (Custom Properties, Glassmorphism, Backdrop Filters, Keyframe Animations)
*   **Logic**: Modern Vanilla ES6+ JavaScript
*   **Cryptography**: Web Crypto API (`crypto.subtle`)
*   **Icons**: Lucide Icons CDN
*   **Typography**: Google Fonts (Outfit & Inter)

---

## Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/saikoful/todo.git
   cd todo
   ```
2. Serve the directory using any static file server:
   ```bash
   # Using Python
   python3 -m http.server 8080
   
   # Using Node.js
   npx http-server -p 8080
   ```
3. Open `http://localhost:8080` in your web browser.

---

## License
Created by [saikoful](https://github.com/saikoful). Available under the MIT License.
