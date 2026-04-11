# Crypto Regulation Atlas (Bilingual PT/EN)

A static GitHub Pages-ready observatory for comparing global crypto regulation with an interactive world map, filters, rankings, bilingual interface (Português/English), and static JSON API.

## Features
- Interactive world map with score-based country coloring
- Portuguese / English switcher with flag buttons
- Country detail panel
- Search and filters by region, trend, score, and topic
- Ranking of most favorable and most restrictive jurisdictions
- Table view
- Static API in JSON (`/api`)
- Simple daily rebuild workflow with GitHub Actions

## Project structure
- `index.html` — main bilingual frontend
- `style.css` — UI styling
- `script.js` — map, filtering, i18n, rendering
- `data/manual-overrides.json` — editorial dataset
- `api/` — generated JSON API
- `scripts/build_api.py` — static API builder
- `scripts/run_pipeline.py` — minimal pipeline entrypoint
- `.github/workflows/daily-update.yml` — daily GitHub Action

## Run locally
Because the frontend uses `fetch()` to load JSON, open the project with a simple local server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages deployment
1. Push the repository to GitHub.
2. In **Settings > Pages**, select **Deploy from branch**.
3. Choose the main branch and `/root`.
4. Save. The site will publish from the repository root.

## Daily update workflow
The current workflow rebuilds the API daily from `data/manual-overrides.json`.
You can later extend the pipeline with fetchers/parsers for official sources.

To test locally:

```bash
python scripts/run_pipeline.py
```

## Editing data
Update `data/manual-overrides.json`.
Then rebuild:

```bash
python scripts/build_api.py
```

## Methodology
The score rewards:
- legal certainty
- proportionality
- innovation openness
- healthy conditions for exchanges
- room for stablecoins and tokenization
- lower risk of excessive state centralization

It does **not** assume that either deregulation or heavy regulation is automatically positive.

## Limitations
- Scores are editorial and comparative, not legal advice.
- Country profiles are simplified summaries.
- The daily pipeline is currently static-first and meant to be expanded with curated official feeds.


## Thesis core package

This project now includes a thesis-core layer with 10 priority jurisdictions for the monograph:

- Brazil
- European Union
- United States
- United Kingdom
- Singapore
- Hong Kong
- Switzerland
- United Arab Emirates
- El Salvador
- Paraguay

Data additions:
- `thesis_core` and `thesis_scope` flags in `api/countries.json`
- richer analytical fields for the thesis jurisdictions
- markdown briefing files in `content/jurisdictions/`
- refreshed `api/rankings.json`, `api/updates.json`, and `api/metadata.json`


## Second round expansion
This package also enriches the comparative layer for Germany, France, Argentina, Chile, Nigeria, China, India, Japan, South Korea, Australia and Canada, with thesis-oriented analytical fields and markdown jurisdiction notes.


## Third Round / Terceira Rodada

This package adds a thematic layer aligned with the thesis:
- `content/themes/stablecoins.md`
- `content/themes/tokenization.md`
- `content/themes/cbdc-drex.md`
- `api/themes.json`
- `data/atlas_master_template.csv`

The goal is to turn the Atlas into an analytical observatory rather than a static repository of norms.

Este pacote adiciona uma camada temática alinhada à tese:
- `content/themes/stablecoins.md`
- `content/themes/tokenization.md`
- `content/themes/cbdc-drex.md`
- `api/themes.json`
- `data/atlas_master_template.csv`

O objetivo é transformar o Atlas em um observatório analítico, e não apenas em um repositório estático de normas.


## Sixth stage additions
- Expanded comparative coverage with additional jurisdictions drawn from PwC 2026 and CCAF materials.
- Added regulatory experiences cards, research base cards, and a short regulatory timeline.
- Added thematic expansion around AML/Travel Rule and market-data infrastructure.


## Seventh stage
- sticky navigation
- timeline and library filters
- drawer for thematic, experience and library details
- expanded regulatory experiences and timeline
- stronger observatory-style front-end navigation


## Eighth stage additions

- multi-filter research library (publisher, theme, jurisdiction)
- richer regulatory experiences cards with categories and source notes
- grouped regulatory timeline with categories and detail drawer
- expanded comparative research base using CCAF, PwC, BIS, FINRA, Chainalysis, WEF and business-finance literature
- refined observatory styling for a more think-tank / research-center presentation


## April 2026 comparative revision

This revision strengthens the thesis-facing comparative layer by improving Japan, South Korea, Australia and South Africa, and by adding new library/timeline entries connected to FSB 2025 and related official sources.


## Metodologia de score (versão weighted_additive_v1)

O Atlas utiliza um modelo aditivo multicritério com nove dimensões e pesos fixos que somam 100 pontos:

- segurança jurídica (18)
- proporcionalidade regulatória (14)
- exchanges/CASPs (10)
- stablecoins (10)
- tokenização (10)
- tributação (9)
- mineração e infraestrutura (9)
- abertura à inovação (10)
- anticentralização (10)

Cada dimensão é avaliada por rubricagem ancorada em cinco níveis: ausência/proibição, estágio incipiente, regime parcial, regime avançado porém incompleto e regime operativo relativamente abrangente. O score final deve ser lido em conjunto com tendência, resumo analítico e estágio de implementação do FSB.


Note: taxation and mining/hardware are supplementary analytical blocks and do not affect the central score.


## Deployment note

Upload the repository contents at the root of the GitHub repository. Do not upload the enclosing build folder alone, otherwise paths to `style.css`, `script.js`, `api/` and `data/` may break in GitHub Pages.

## April 2026 fix

- fixed map rendering by normalising `api/countries.json` whether it is an array or an object with `countries`
- added `api/metrics.json` and more robust KPI loading
- enriched key jurisdictions with structured primary sources
- added DeFi as a supplementary analytical layer
