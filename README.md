# hareeshwar.com

Static site built on Framework7 9.3.0, loaded from jsDelivr with the version pinned and integrity hashes checked. No build step.

| Device | Look |
|---|---|
| iPhone, iPad, Mac | Framework7 iOS 26 theme (glass tab bar, large titles, App Store style cards) |
| Android | Framework7 Material You theme (vibrant dark scheme) |
| Windows | Material base restyled as Fluent (Segoe UI Variable, 4/8px corners, accent pill sidebar) |

Phones get a bottom tab bar. Screens 1024px and wider get a sidebar instead.

## Preview any look on one machine
Add `?look=ios`, `?look=android` or `?look=windows` to the URL.

## Run locally
    python3 -m http.server 8000
Then open http://localhost:8000

## Deploy (GitHub Pages)
Copy everything here into the root of the Pages repo, commit, push. `CNAME` keeps the custom domain, `.nojekyll` stops Jekyll from touching the files.

## Where to edit
- Content: `index.html` (each tab is a `view` block, pushed pages are `<template>`s)
- Platform styling: `css/app.css` (`.look-ios`, `.look-android`, `.look-windows`)
- Platform detection and animations: inline script in `<head>` and `js/app.js`
