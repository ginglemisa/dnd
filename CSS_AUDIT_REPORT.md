# CSS Audit Report

Scope analyzed:
- `css.js` injected stylesheet
- `<style id="pretty-ui-overrides">` in `index.html`
- additional inline `<style>` in `index.html`
- equivalent inlined styles in `index-single.html`

---

## Definitely unused

1. `#scrollToTopBtn` and `#scrollToTopBtn:hover` inside `css.js` are **never applied** because they are assigned to `style.textContent` and then overwritten by `style.innerHTML` before the style node is appended.
   - Result: these selectors do not exist in the final stylesheet at runtime from `css.js`.

2. `#condition-button-grid .active-condition` (from `css.js`) appears to target markup that is not present in `index.html`.
   - This one is only “definitely unused” for `index.html` static markup; in script-driven states it could still become used.

---

## Probably redundant

1. Repeated mobile 2-column declarations at `max-width: 420px`:
   - `.form-grid-2col`, `.save-grid`, `.skill-grid`, `.spell-picked-grid` are set to two columns in base/desktop styles and then set again to effectively the same 2-column shape in mobile blocks.
   - In several places this is restating the same layout intent with only small gap changes.

2. `.ability-grid` is repeatedly constrained to 2 columns in base and again in narrow mobile rules.

3. `.spell-slot-grid` in narrow breakpoints (`max-width:420px` and `max-width:339px`) repeats the same three-column track definition already set globally in overrides.

4. `details.section summary { cursor: pointer; }` overlaps with broader `details > summary { cursor: pointer; }` (same behavior, narrower scope reasserted).

5. Duplicated selector blocks that mainly restate same layout role across files (`css.js` + `index.html` + `index-single.html`):
   - `.form-grid-6col`, `.save-pair`, `.skill-grid`, `.save-grid`, `.spell-picked-grid`, `.section`, `.spell-toolbar`, `body`, `.tabs`.

---

## Overridden by later rules

1. In `css.js`: `style.textContent = ...` is overridden by `style.innerHTML = ...` on the same style element.
   - Practical effect: first block is discarded.

2. In `index.html`, later `body` rules override earlier body settings:
   - earlier gradient/visual rule + later `max-width: 920px`, `padding-bottom` etc.
   - some properties complement, but repeated `body` declarations fragment layout responsibility.

3. `.tabs` from `css.js` (`position: fixed`) is later overridden in `index.html` (`position: sticky`, different padding/gap/z layering).

4. `.tab-button` / `.tab-button.active` in `css.js` are heavily overridden by `#pretty-ui-overrides` with `!important` (border radius, backgrounds, active colors).

5. `.section`, `.spell-toolbar`, `.output`, input controls, `.save-grid`, `.skill-grid`, `.skill-cell`, `.save-pair`, `.circle-checkbox`, `.modifier` all receive later competing declarations (many with `!important`) from `index.html` style, which supersede defaults from `css.js`.

6. `.form-grid-6col` appears in:
   - `css.js` base grid (6 columns),
   - `index.html` override (3 columns + `!important`),
   - inline style in body (6 autos),
   - mobile override (2 columns),
   - extra-small override (1 column).
   This selector is a hotspot of cascading overrides.

---

## Needs manual review

1. **Cross-file duplication strategy** (`css.js` and large in-document override styles):
   - unclear whether `css.js` is meant to be a reusable base theme while `index.html` is a page-specific theme, or whether one should absorb the other.

2. **`index.html` vs `index-single.html` parity**:
   - `index-single.html` appears to inline near-complete CSS/JS, while `index.html` uses external JS + large embedded CSS.
   - possible maintenance drift and selector mismatch risk.

3. **Media-query overlap responsibilities**:
   - multiple `@media (max-width:420px)` blocks in the same sheet with overlapping selectors.
   - re-grouping by component (or single breakpoint section) would reduce accidental override bugs.

4. **Use of `!important` across core layout components**:
   - may be compensating for source-order conflicts rather than intentional hierarchy.
   - suggests unresolved layering between base and override themes.

5. **Potentially stale selector coverage tied to dynamically inserted DOM**:
   - classes like `.feat-row-head`, `.spell-row-top`, `.feat-icon-btn*`, `#beastPopup`, modal classes are likely JS-created; usage is valid but should be verified against actual runtime paths in both entry pages.

---

## Media query overlap summary

- Two separate `@media (max-width:420px)` groups in `index.html` both touch tabs, section spacing, and grid behavior.
- `css.js` also has `@media (max-width:420px)` and `@media (max-width:339px)` for many of the same grid selectors.
- `index.html` then redefines similar `max-width:339px` rules again.

This creates layered breakpoint logic in three places (base CSS file, override block, and extra inline block), making it hard to reason about the final mobile layout without tracing source order and `!important` precedence.
