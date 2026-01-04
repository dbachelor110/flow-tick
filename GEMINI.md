# FlowTick - Obsidian Plugin

## Project Overview

**FlowTick** is an Obsidian plugin that creates auto-updating progress bars for checklists.
It allows users to insert ` ```flowtick ``` ` code blocks into their notes. The plugin tracks checklist items (`- [ ]`, `- [x]`) appearing after the code block (up to the next flowtick block or end of file) and renders a visual progress bar.

### Key Features
*   **Auto-updating:** Refreshes at a configurable interval (default 1s).
*   **Nested Checklists:** Calculates progress recursively (parent completion is the average of children).
*   **Dynamic Colors:**
    *   < 21%: Red
    *   21% - 99%: Green
    *   100%: Blue
*   **Multiple Bars:** Supports multiple tracked sections in a single file.

### Architecture
*   **Entry Point:** `main.ts` - Handles plugin lifecycle, registers code block processor, and manages the update loop.
*   **Settings:** `src/settings.ts` - Manages plugin settings (refresh interval, color mode).
*   **Rendering:** `src/progress.ts` - Handles the DOM manipulation to draw the progress bar.
*   **Build System:** `esbuild` bundled via `esbuild.config.mjs`.

## Building and Running

### Prerequisites
*   Node.js (>=16 recommended)
*   npm or yarn

### Key Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the build in watch mode. Updates `main.js` on file changes. |
| `npm run build` | Performs a production build (minified, no sourcemaps). |
| `npm version <newversion>` | Bumps version, updates `manifest.json` and `versions.json`. |

### Installation for Development
1.  Clone the repository into your Obsidian vault's `.obsidian/plugins/` directory (e.g., `.../MyVault/.obsidian/plugins/flow-tick`).
2.  Run `npm install`.
3.  Run `npm run dev`.
4.  Enable the plugin in Obsidian's "Community Plugins" settings.
5.  Reload Obsidian (`Cmd+R`) to see changes.

## Development Conventions

*   **Language:** TypeScript (`.ts`).
*   **Styling:** CSS in `styles.css`.
*   **Formatting/Linting:** Uses `eslint` and `prettier`.
    *   Run `npx eslint .` to check for linting errors.
*   **Obsidian API:** heavily relies on `obsidian` package (MetadataCache, MarkdownView, etc.).
*   **State Management:** The plugin relies on `this.app.metadataCache` to read file content and list items efficiently, rather than parsing raw file text manually.
*   **DOM Updates:** Uses direct DOM manipulation (finding/creating elements) within the Markdown preview/source view.

## File Structure

*   `main.ts`: Main plugin class, logic for finding list items and calculating progress.
*   `src/progress.ts`: Pure UI logic for rendering the bar.
*   `src/settings.ts`: Settings tab implementation.
*   `styles.css`: CSS for the progress bar appearance.
*   `manifest.json`: Obsidian plugin manifest.
*   `esbuild.config.mjs`: Build script.
