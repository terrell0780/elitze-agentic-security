---
name: a11y-debugging
description: Uses Chrome DevTools MCP for accessibility (a11y) debugging and auditing based on web.dev guidelines. Use when testing semantic HTML, ARIA labels, focus states, keyboard navigation, tap targets, and color contrast.
tools:
  - chrome-devtools
---

# Accessibility (a11y) Debugging & Auditing Skill

## Purpose
Guide the AI agent in identifying, diagnosing, and remediating accessibility barriers on target web pages using Chrome DevTools MCP tools, following WCAG 2.1/2.2 Level AA and web.dev best practices.

---

## Core Audit Checklist & Methodology

When requested to audit or debug a page, execute the following audit phases in order:

### 1. Semantic Structure & Landmarks
- **Requirement:** Prefer native HTML5 landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section>`) over generic `<div>` elements. Ensure heading levels (`<h1>` through `<h6>`) are strictly hierarchical without skipping levels.
- **DevTools MCP Actions:**
  - Query DOM hierarchy for heading tags (`h1`, `h2`, `h3`).
  - Verify there is exactly one `<h1>` representing the primary page purpose.
  - Verify every interactive control is a native element (`<button>`, `<a>`, `<input>`) or has explicit ARIA roles (`role="button"`, `tabindex="0"`).

### 2. ARIA Attributes & Accessible Names
- **Requirement:** Every interactive element, image, and icon button must have a non-empty accessible name (computed via text content, `aria-label`, `aria-labelledby`, or `alt` text).
- **Checks:**
  - `<img>` without `alt` attribute (decorative images must have `alt=""`).
  - Icon-only buttons (`<button><svg>...</svg></button>`) without `aria-label`.
  - Misused ARIA roles (e.g., `role="button"` on non-interactive `span` without keyboard event listeners).
  - Broken ARIA references (`aria-labelledby` or `aria-describedby` pointing to nonexistent IDs).

### 3. Keyboard Navigation & Focus Management
- **Requirement:** All interactive controls must be reachable and operable via keyboard alone (`Tab`, `Shift+Tab`, `Enter`, `Space`, Arrow keys).
- **Checks:**
  - **Focus Visible:** Ensure `:focus` or `:focus-visible` outlines are not removed with `outline: none` or `outline: 0` without an accessible fallback.
  - **Tab Order:** Verify logical DOM order matches visual layout (no arbitrary positive `tabindex` values like `tabindex="1"`).
  - **Focus Trapping:** Modal dialogs must trap focus inside the modal when open and return focus to the trigger upon closing.

### 4. Color Contrast (WCAG AA)
- **Requirement:** 
  - **Normal text (< 18pt / 24px or < 14pt / 18.5px bold):** Minimum contrast ratio of **4.5:1** against its background.
  - **Large text (≥ 18pt / 24px or ≥ 14pt / 18.5px bold):** Minimum contrast ratio of **3.0:1**.
  - **UI components and graphical objects:** Minimum contrast ratio of **3.0:1**.
- **DevTools MCP Actions:**
  - Inspect computed CSS colors (`color`, `background-color`, parent overlays).
  - Calculate contrast ratios for body copy, navigational links, and button labels.

### 5. Touch & Tap Targets (Mobile/Touch Viewports)
- **Requirement:** Interactive targets must have an accessible touch target size.
  - **web.dev / WCAG 2.5.8:** Minimum **24x24 CSS pixels** with adequate spacing, or ideally **48x48 CSS pixels** for primary mobile interactions.
- **DevTools MCP Actions:**
  - Measure element bounding boxes (`getBoundingClientRect`) for buttons, links, and form inputs.

---

## Standard Execution Workflow for the Agent

When auditing a page (e.g., `https://www.elitze.info/` or a local development server):

1. **Navigate to Target:**
   - Launch browser/page via DevTools MCP and wait until network is idle.
2. **Run Automated Scan Script via Runtime:**
   - Execute an in-page script evaluation to collect missing `alt` attributes, empty labels, and tap target violations:
     ```javascript
     (() => {
       const issues = [];
       // Check images missing alt
       document.querySelectorAll('img:not([alt])').forEach(el => {
         issues.push({ type: 'missing-alt', selector: el.tagName + (el.id ? '#' + el.id : '') });
       });
       // Check buttons without accessible name
       document.querySelectorAll('button').forEach(btn => {
         const name = btn.innerText.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title');
         if (!name) issues.push({ type: 'empty-button', selector: btn.outerHTML.slice(0, 100) });
       });
       return issues;
     })();
     ```
3. **Inspect the Accessibility Tree:**
   - Use DevTools MCP accessibility domain to query the AX tree of key layout nodes.
4. **Compile Findings:**
   - Group findings by severity (Critical, Serious, Moderate, Minor).

---

## Audit Output Format

Present all findings using this standard structure:

### Summary
- **URL Audited:** `<target URL>`
- **Total Issues Found:** `<count>` (Critical: X, Serious: Y, Moderate: Z)

### Findings Table
| Severity | Category | Target Selector | WCAG Criterion | Issue Description |
| :--- | :--- | :--- | :--- | :--- |
| Critical | ARIA | `button.nav-toggle` | 4.1.2 (Name, Role, Value) | Missing accessible name on mobile hamburger button. |
| Serious | Contrast | `p.footer-text` | 1.4.3 (Contrast Minimum) | Ratio is 2.8:1 (Expected: 4.5:1). |

### Actionable Remediation Code
For each identified violation, provide the exact code fix:

```html
<!-- Before -->
<button class="nav-toggle"><svg>...</svg></button>

<!-- After -->
<button class="nav-toggle" aria-label="Toggle Navigation Menu">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>