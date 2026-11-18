# AXON — Story Landing Page

A cinematic, scroll-driven brand landing page (Persian, RTL) for a digital product studio.
The page tells a short story — from slow, crowded software teams to building with AI agents — and
showcases the studio's products along the way.

- **WebGL particle engine** — about 24,000 particles that morph into a different symbol for every chapter.
- **The scroll is the timeline** — each scene holds on screen while you scroll. The copy blurs in and out,
  and the particles travel between shapes exactly as far as you have scrolled.
- **Horizontal product showcase** — the products section pins and scrolls sideways, with each product
  bringing its own particle shape, colour theme and animated background.
- **Hold-to-enter intro**, a technical HUD, a top progress bar, a custom cursor and film grain.
- **No build step** — plain HTML, CSS and ES modules. Three.js, GSAP and Lenis load from a CDN.

## Story

| # | Chapter | Message (translated) | Particle shape | Background |
|---|---|---|---|---|
| 00 | Yesterday | One idea, dozens of developers, months of waiting. | `crowd` — a crowd of people | `code` |
| 01 | The turn | That era is over. | `hourglass` — with falling sand | — |
| 02 | Today | AI agents have joined the team. | `bot` | `network` |
| 03 | Velocity | Less time, better results. Months → weeks. | `zap` | `warp` |
| 04 | Idea | Any spark in your mind can become a website / app / store / platform. | `bulb` | `blueprint` |
| 05.1 | Crypto exchange | Trades in a fraction of a second, bank-grade security. | `bitcoin` | `candles` |
| 05.2 | Marketplace | Thousands of shops, one unified market. | `cart` | `store` |
| 05.3 | Gold market | Real gold at today's live price. | `ingots` — stacked gold bars | `gold` |
| 05.4 | Online lawyer | Legal advice, just one message away. | `scales` | `legal` |
| 05.5 | Online store | From the first click to the doorbell. | `bag` | `shop` |
| 06 | Your brand | Your brand, a showcase that gets noticed. | `landing` — a landing-page frame | `grid` |
| 07 | The experts | Just bring your idea; leave the building to the experts. 😉 | `orbits` | — |
| 08 | Start | The next story is yours. Telegram · WhatsApp · Email · Phone | `ring` | `tunnel` |

## Getting started

Requires [Node.js](https://nodejs.org/) (any recent version). Nothing to install.

```bash
node serve.mjs
```

Then open <http://localhost:5173>. Set the `PORT` environment variable to use a different port.

To deploy, upload the project folder to any static host (Nginx, Netlify, Vercel, GitHub Pages, cPanel).

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | All content and chapter configuration |
| `assets/css/style.css` | Design tokens, typography, atmosphere layers, HUD, sticky scenes, responsive rules |
| `assets/js/main.js` | Intro gate, smooth scroll, story engine (scroll → shape / colour / placement), horizontal products, text reveals |
| `assets/js/particles.js` | Three.js particle scene: shape library, shaders, morphing, scroll scrubbing |
| `assets/js/backdrop.js` | 2D canvas backgrounds, one function per scene |
| `serve.mjs` | Minimal zero-dependency static server for local development |
| `_v1/`, `_v2/` | Earlier design iterations, kept for reference (each runs with `node _v1/serve.mjs` / `node _v2/serve.mjs`) |

## Fonts

From Google Fonts: **Alexandria** (headlines), **Handjet** (accent words), **Vazirmatn** (body text) and
**Martian Mono** (labels and numbers).

## Customisation

- **Brand name** — "آکسون / AXON" is a placeholder. Search and replace it in `index.html`.
- **Contact details** — the Telegram, WhatsApp, email and phone links in the `#contact` section and the footer
  of `index.html` are placeholders.
- **Chapters** — every `<section data-shape="…">` is one stop in the story and is controlled by its attributes:
  - `data-shape` — particle shape: `crowd`, `hourglass`, `bot`, `zap`, `bulb`, `bitcoin`, `cart`, `ingots`,
    `scales`, `bag`, `landing`, `orbits`, `ring` (also `sphere`, `galaxy`, `chaos`, `helix`, `torus`, `coins`, …)
  - `data-bg` — background scene: `code`, `network`, `warp`, `blueprint`, `candles`, `store`, `gold`, `legal`,
    `shop`, `grid`, `tunnel`, `none`
  - `data-theme` — colours: `mint`, `violet`, `cyan`, `gold`, `ice`, `lime`
  - `data-px` / `data-py` — where the shape sits on screen (-1 … 1; left/bottom → right/top)
  - `data-scale`, `data-dim` — shape size and brightness
  - `data-align` (`left` / `right` / `center`) and `data-valign` (`start` / `center` / `end`) — text position
- **Adding a product** — copy a `<section class="chapter-sec product">` inside `#hTrack` and update its number.
- **New particle shape** — add an SVG path to `ICONS` or a point function to `SHAPES` in `assets/js/particles.js`.
- **New background** — add a scene function to `assets/js/backdrop.js` and register it in `SCENES`.
- **Pacing** — the height of `.chapter-sec` in `style.css` (default `175vh`) sets how long each scene holds;
  `hLen()` in `main.js` sets how much scrolling the horizontal products take.

## Accessibility

- With `prefers-reduced-motion`, the intro opens automatically, smooth scrolling is off and motion is minimal.
- The hold-to-enter button works with the keyboard (hold Space or Enter), and there is a "skip" option.
- If WebGL is unavailable, the site still works with its CSS atmosphere and canvas backgrounds.
