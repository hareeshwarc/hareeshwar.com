# hareeshwar.com

Static multi-page site. Plain HTML, CSS and JS with no build step on the server.

## Pages

- `index.html`: home, story tiles, path, writing
- `stories/*.html`: one deep dive per story
- `assets/site.css`, `assets/site.js`: all styling and interactions
- `assets/icon.svg`, `apple-touch-icon.png`, `icon-512.png`, `og.png`: icons and share image

## Looks

| Device | Look |
|---|---|
| iPhone, iPad, Mac | Apple style |
| Android | Material 3 |
| Windows | Fluent |

Preview any look with `?look=apple`, `?look=android` or `?look=windows`.
Light and dark follow the system until the toggle is used, then the choice is remembered.

## Libraries

GSAP 3.15.0 and Lenis 1.3.27 from jsDelivr, version pinned with SRI hashes. The site works without them.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## Deploy

GitHub Pages from `main`. `CNAME` keeps the custom domain.
