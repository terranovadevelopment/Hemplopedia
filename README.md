# Hemplopedia — first working website (Phase 2 preview)

This is a static, responsive website based on the original Hemplopedia PDF. It includes a searchable catalog, 32 category filters, 511 topic detail views, DuckDuckGo article/image/video links, and the original PDF. No server-side database or paid service is required.

## Run locally

From this folder, run `python -m http.server 8000` and visit `http://localhost:8000`. Opening `index.html` directly from a file URL may prevent JSON loading due to browser security restrictions.

## Deploy

Upload the folder contents to a GitHub repository. Deploy as a **Static Site** in Render with publish directory `.` (repository root) and no build command. Or enable GitHub Pages for the repository root. No domain or external deployment has been performed.

## Catalog audit

The initial Phase 1 extraction reported 711 entries, including 300 Legal entries. Inspection of PDF pages 144–149 showed each legal jurisdiction has three DuckDuckGo links that the first extraction mistakenly counted as separate topics. These have been consolidated to 100 jurisdictions, producing **511 topics across 32 categories**. The legal search URLs were normalized to remove accidental search-query suffixes such as `hemp all` and `hemp images`; original legal URLs are preserved in `data/catalog.json` under `original_links`.

100 non-legal entries required at least one generated DuckDuckGo search fallback because the extraction did not capture all three URLs. Generated fallbacks are flagged under `link_provenance`. These are search links, **not verified original hyperlinks**. Descriptions in the PDF are often repeated boilerplate and are intentionally not published as factual topic explanations. All topics remain research-pending; links and page references should be checked before presenting this as a fully verified encyclopedia.

## Files

- `index.html`, `styles.css`, `app.js`: site
- `data/catalog.json`: complete corrected catalog, with source pages and link provenance
- `data/categories.json`: categories and counts
- `data/catalog.csv`: spreadsheet-friendly export
- `Hemplopedia_Original_Book.pdf`: unchanged source PDF
- `build.py`: reproducible correction/conversion script (requires the Phase 1 files in `/mnt/data/hemplopedia_phase1`)

The website is free to share; the original book's rights remain with its author. The donation link is https://buymeacoffee.com/billbuttso.
