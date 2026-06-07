# Moistello Frontend — Agentic Development Guidelines

## Styling Rule

**NO page should look like another.** Every page MUST have unique styling elements beyond the shared theme tokens.

### Allowed (shared theme)
- Color tokens: `text-foreground`, `text-muted-foreground`, `text-aurora-violet`, `text-emerald-400`, `text-amber-400`, `text-red-400`
- Background tokens: `bg-background`, `bg-card`, `gradient-bg`, `gradient-bg-extended`, `gradient-text`, `gradient-text-extended`, `holo-text`
- Font families: `font-heading`, `font-mono`, `font-body`
- Utility tokens: `container-premium`
- Glow/effect: `holo-glow`, `holo-border`, `tilt-hover`, `animate-pulse-glow`, `depth-4`

### Forbidden
- `glass`, `glass-premium`, `glass-strong`, `glass-whisper`, `glass-flagship`, `rounded-2xl` — these are card defaults and make every page look identical

### Required (every page must pick different combinations)
Use 3+ of these per page. NO TWO PAGES should use the same set:

- **Border accents**: `border-l-4 border-l-aurora-violet` / directional borders on content blocks
- **Full-bleed sections**: Sections that span edge-to-edge with gradient backgrounds
- **Decorative pseudo-elements**: Gradient bars, accent lines, corner decorations via empty divs
- **Large typography**: Giant numbers, oversized headings as visual anchors
- **SVG/pattern backgrounds**: Inline SVG shapes, grid patterns, dot patterns
- **Pill/tag layouts**: Inline pill-shaped labels instead of card-contained lists
- **Underline/tab navigation**: Active indicator bars, animated underline accents
- **Floating elements**: Absolute-positioned decorative circles, blobs, or glyphs
- **Divider creativity**: Gradient dividers, angled separators, dotted lines instead of cards
- **Z-pattern layouts**: Alternating left/right content arrangement
- **Masonry/staggered grids**: Non-uniform grid layouts
- **Full-width callout strips**: Colored banner strips that cut across the layout
- **Avatar/initial clusters**: Grouped avatar circles as visual elements
- **Timeline layouts**: Vertical timeline with connecting lines and dots
- **Step indicators**: Numbered or icon-based step progress outside of cards
- **Toggle/switch arrays**: Rows of toggle switches without card wrapping

### Audit
Before building ANY new page, scan the existing pages for their styling fingerprint. If your page uses the same 3 elements as any existing page, change your approach.
