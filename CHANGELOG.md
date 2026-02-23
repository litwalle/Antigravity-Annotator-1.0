# Changelog

All notable changes to Antigravity Annotator will be documented in this file.

---

## [1.2.0] — 2026-02-23

### Major Release: Object Model Architecture & New Tools

This is a major architectural upgrade. The rendering engine has been migrated from a raster-based pixel snapshot system to a full **object model architecture**, enabling per-element selection, editing, and manipulation.

### Architecture

- **Object model migration** — Annotations are now stored as structured data (`Annotation[]`) instead of raw pixel snapshots (`ImageData[]`), enabling selection, deletion, repositioning, and re-editing of individual elements.
- **Rendering pipeline** — New unified rendering pipeline: clear canvas → draw background → render each annotation → render draft → draw selection indicators.
- **Design token system** — Centralized visual constants (`designTokens.ts`) for colors, radii, shadows, typography, transitions, and z-index.
- **Modular codebase** — Main component decomposed into focused modules: hooks (`useCanvasDrawing`, `useAnnotatorHistory`, `useKeyboardShortcuts`), utility functions (`canvasUtils`), and UI components (`Toolbar`, `IconBtn`, `TextOverlay`, `TextSizeMenu`, `ColorPicker`, etc.).

### New Tools

- **Select tool** (`V`) — Click to select annotations, Cmd+Click for multi-select. Selected elements show a blue selection border.
- **Arrow tool** (`A`) — Drag to draw arrows with triangular arrowheads. Supports customizable color.
- **In-place text editing** (`T`) — Click to create a text box directly on the canvas. Supports:
  - Resizable text box with 8 drag handles (corners + edges)
  - Floating font size menu (A+/A-) for quick size adjustment (12–72px)
  - `Cmd+Enter` to confirm, `Escape` to cancel
  - Double-click to re-edit existing text annotations

### New Features

- **Drag to move** — Select annotations and drag to reposition them. Supports moving multiple selected elements at once.
- **Delete** — Remove selected annotations via `Delete`/`Backspace` key or toolbar button.
- **Redo** — Full redo support (`Cmd+Shift+Z`), redo stack clears on new operations.
- **Color picker** — 8 neon colors with visual picker in toolbar.
- **Hit testing** — Per-type collision detection for selecting annotations (segment distance for freehand/arrow, bounds for rect/text/comment).

### Improvements

- **Canvas-textarea consistency** — Text rendering on canvas now matches textarea display exactly (font size, line height, padding, vertical alignment).
- **Keyboard shortcuts** — Full shortcut set: `V` (select), `P` (draw), `H` (highlight), `A` (arrow), `C` (comment), `T` (text), `K` (crop), `Delete` (delete selected).
- **Icon system** — Unified Lucide icon set with consistent sizing, hover states, and disabled states across all toolbar buttons and menus.

---

## [1.0.6] — 2025-12-01

- Bumped version, added Chrome extension install guide with review status.
- Added preview screenshot.

## [1.0.5] — 2025-11-28

- Added Chrome extension download and improved installation guide.

## [1.0.0] — 2025-11-25

### Initial Release

- Screenshot capture of visible webpage
- Freehand drawing tool with neon colors
- Rectangle highlight tool
- Comment tool with pointer lines
- Text annotation tool
- Crop tool
- Copy to clipboard
- Send to Antigravity (via VS Code companion extension)
- Undo support (`Cmd+Z`)
- Retina display support
- Shadow DOM isolation
