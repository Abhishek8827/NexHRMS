# 🚀 School Website Optimization Report

This report outlines the technical improvements needed to achieve a professional-grade score for Performance, SEO, and Accessibility.

---

## 📈 Search Engine Optimization (SEO)
*Critical for schools to be easily found by parents on Google.*

- [ ] **Meta Descriptions**: Add `<meta name="description">` to [index.html](file:///c:/Users/CB/Documents/tvsm_school/index.html) describing TVSM's location and legacy.
- [ ] **Dynamic Titles**: Currently, all pages say "Thakur Virendra Singh Memorial School". Needs logic to change to "About Us | TVSM" or "Academics | TVSM".
- [ ] **Social Media Cards**: Add Open Graph (`og:`) tags so sharing the link on WhatsApp/Facebook shows a rich preview image.
- [ ] **Semantic HTML**: Refactor `<div>` wrappers to `<section>` and `<article>` to help search spiders index our content.

---

## ♿ Accessibility (A11y)
*Ensures the site is usable for all families, including those with disabilities.*

- [ ] **Descriptive Alt Text**: Every `<img>` tag needs a meaningful description (e.g., "Students studying in our advanced computer lab").
- [ ] **Aria Labels**: Add `aria-label` to the **← Prev** and **Next →** buttons in the news carousel.
- [ ] **Keyboard Nav**: Test "Tab" key navigation and ensure distinct focus rings around buttons and links.
- [ ] **Contrast**: Check light-grey text against off-white backgrounds (WCAG 2.1 compliance).

---

## ⚡ Performance
*Crucial for fast loading on mobile data during school commutes.*

- [ ] **Lazy Loading**: Add `loading="lazy"` to all images below the "Hero" section.
- [ ] **Image Optimization**: Convert Unsplash/External URLs to local, compressed `.webp` formats.
- [ ] **Layout Stability**: Add explicit `width` and `height` attributes to images to prevent the page from jumping while loading (CLS).
- [ ] **Pre-fetching**: Use `<link rel="preconnect">` for Google Fonts to speed up initial font rendering.

---

> [!TIP]
> **Priority Item**: The Meta Description and Image Alt-Text are the most important for your local Google ranking in Nepanagar.