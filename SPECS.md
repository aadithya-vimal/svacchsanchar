# SvacchSanchar — Specifications & Hosting

## 1. Scope

SvacchSanchar is a **browser-only** digital twin for PS13, focused on Bengaluru municipal solid-waste collection routing.

The application intentionally has:

- **No backend**
- **No database**
- **No server-side API routes**
- **No required environment variables**
- **No required provider credentials**
- **No application-controlled secret store**

The only supported production hosting target for this project is **Cloudflare Pages**.

## 2. Technology stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Language | TypeScript |
| Bundler | Vite |
| 2D/3D geospatial | CesiumJS |
| Cesium integration | vite-plugin-cesium |
| Client state | Zustand |
| Styling | Custom CSS / CSS variables |
| Large bin rendering | Cesium `PointPrimitiveCollection` |
| Static model/data | TypeScript + JSON-compatible local data |
| Browser persistence | localStorage for optional provider credentials |
| Testing | Vitest |
| Hosting | **Cloudflare Pages only** |

## 3. Runtime architecture

```text
                         CLOUDFLARE PAGES
                                │
                         Static Vite assets
                                │
                              Browser
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
         Cesium              Zustand          Local engines
            │                   │                   │
        2D + 3D          Twin / UI state      Simulation
            │                                      Routing
            │                                      Scenarios
            └───────────────────┬──────────────────┘
                                │
                         Client-side state
                                │
                          Optional localStorage
```

There is no request path through a project-owned backend.

## 4. Deployment — Cloudflare Pages only

Cloudflare's current Pages configuration for a React/Vite site uses:

- **Build command:** `npm run build`
- **Build output directory:** `dist`

After deployment, Pages provides the project at a `*.pages.dev` subdomain. Cloudflare also supports preview deployments for pushed changes/PRs. See the official Pages documentation for the current UI and settings. 

### Git deployment

1. Push this repository to GitHub.
2. In Cloudflare, open **Workers & Pages**.
3. Create a **Pages** application from the Git repository.
4. Set the production branch to `main`.
5. Set:

```text
Build command:       npm run build
Build output:        dist
```

6. Deploy.

### Local verification before pushing

```bash
npm install
npm run build
npm run test
npm run dev
```

The application requires no `.env` configuration.

## 5. Provider credential model

The project follows a **bring-your-own-provider-key** model.

The user opens the deployed `*.pages.dev` site, opens **Provider Center**, pastes their own optional credentials, and the browser uses them directly.

The application never needs a project-controlled credential for the core demo.

### Local storage

Optional provider values are stored in browser `localStorage` with `sv.*` keys.

They are not sent to a project backend because there is no backend.

### Client-exposed key warning

Any browser-exposed mapping key/token must be treated as public client material. Users should restrict the credential at the provider to the deployment origin and the smallest set of APIs required.

## 6. Provider matrix

### Google Maps Platform

**Use:** Photorealistic 3D Tiles.

Google's Map Tiles API supports photorealistic 3D tiles, 2D tiles and Street View-related tile functionality. Google requires authentication and billing for Map Tiles API access. In CesiumJS, the `GoogleMaps.defaultApiKey` value can be used with `createGooglePhotorealistic3DTileset`. 

**App behavior:** 3D mode attempts the photorealistic tileset when a Google key is configured. If unavailable, the app falls back to its local procedural 3D city.

### Cesium ion

**Use:** optional world terrain / hosted assets.

Set a user-supplied ion token in Provider Center. The app does not require the token for its core digital twin.

### MapTiler

**Use:** optional streets and satellite basemaps.

MapTiler issues API keys and documents provider-side protection for publicly used keys. 

### Mapbox

**Use:** optional streets and satellite basemaps.

Mapbox distinguishes public client-side tokens from secret server-side tokens. Use a public token with the minimum required scope for browser use. 

### Stadia Maps

**Use:** optional Alidade Smooth, Alidade Smooth Dark and Alidade Satellite raster styles.

Stadia documents domain-based authentication for production websites and API-key authentication for other client contexts. A current account can be created from the Stadia client dashboard. 

### HERE

**Use:** optional external route validation.

The core optimizer does not depend on HERE. A configured key can be used later to validate a selected route externally; the API supports car/truck-style routing and returns route length/time summaries. 

### TomTom

**Use:** optional traffic integration.

Traffic is not required for the simulation. The local engine can simulate slowdowns itself, so a user never needs a TomTom credential to run the hackathon demo.

### openrouteservice

**Use:** optional external route validation.

The internal routing engine remains the canonical optimizer.

### Keyless styles

The application also supports keyless base-map fallbacks such as OpenStreetMap/CARTO/Esri imagery where appropriate. Public tile providers have their own usage policies, availability and attribution requirements; they should not be treated as unlimited production infrastructure.

For example, OpenStreetMap explicitly states that its public tile servers are capacity-limited and may block inappropriate/heavy use. 

## 7. 2D + 3D behavior

The scene uses one Cesium viewer rather than two disconnected map engines.

```text
                  CESIUM SCENE
                       │
              ┌────────┴────────┐
              │                 │
             2D                3D
              │                 │
       Operational map    Eye-of-God view
              │                 │
              └───────┬─────────┘
                      │
               same twin state
```

2D mode is designed for precise operational interaction. 3D mode uses either photorealistic provider tiles (when configured) or the built-in procedural city fallback.

## 8. Large-scale entity rendering

The twin contains **120,000 bins** and **512 trucks**.

120k bins are not represented as 120k Cesium `Entity` objects. The application uses a `PointPrimitiveCollection` for efficient GPU-oriented marker rendering.

Only a small near-field set is promoted to heavier 3D entity representations.

This is deliberate: rendering 120k detailed entities would create an avoidable frame-time and memory problem.

## 9. Truck & bin visualization

### 2D

- Custom SVG truck glyphs.
- Custom SVG bin glyphs.
- Semantic state indicators.

### 3D

- Truck bodies use 3D geometry in the scene.
- Bin representations use simple 3D solids.
- Optional photorealistic city context can be supplied by Google 3D Tiles.

## 10. Simulation model

The core model is deterministic and client-side.

```text
Simulation clock
       ↓
Time-of-day profile
       ↓
Season profile
       ↓
Zone behavior
       ↓
Scenario events
       ↓
Bin fill levels
       ↓
Demand candidates
       ↓
Fleet optimization
       ↓
Truck movement
       ↓
Metrics / visualization
```

### Time awareness

The simulation applies different generation rates for nighttime, morning, daytime and evening.

### Season awareness

The current implementation distinguishes:

- Summer
- Monsoon
- Winter

The values are simulation parameters, not claims about a municipal measurement dataset.

## 11. Simulation controls

- Pause / resume.
- 0.5× → 50× speed.
- Continuous time progression.
- Fast-forward by allowing higher simulation speed.
- Rewind up to one hour.
- Rolling snapshot history sufficient for interactive replay.

Rewind replaces both clock and twin-state arrays from a historical snapshot.

## 12. Routing model

Two route plans are maintained:

### Fixed baseline

A deterministic control case representing a static collection schedule.

### Optimized

The local heuristic ranks demand-critical bins and assigns stops across multiple trucks while considering:

- current truck load
- distance
- bin fill urgency
- stop limits
- fleet availability

The architecture is intentionally modular so a richer VRP/CVRP solver can replace the heuristic without rewriting the UI.

## 13. Scenario engine

Scenario events are first-class objects:

```ts
{
  id,
  type,
  title,
  startAt,
  durationHours,
  intensity,
  targetZone,
  targetTruck
}
```

Supported scenario concepts:

- Waste surge
- Overflow escalation
- Truck breakdown
- Road closure
- Traffic slowdown
- Sensor failure
- Truck overload
- Fleet reduction
- Demand shift
- Heavy rain
- Combined disruption

## 14. Scenario semantics

Scenarios must change the actual twin state rather than changing a display number in isolation.

```text
Scenario
   ↓
Twin state
   ↓
Bin / truck / road constraints
   ↓
Route optimization
   ↓
Truck movement
   ↓
Metrics
```

## 15. CRUD and local data

The application is designed for client-side CRUD over twin entities and configuration.

For the hackathon starter, the deterministic core dataset is generated locally so the bundle does not need a giant 120,000-row JSON payload.

This makes deployment smaller and keeps the data reproducible.

## 16. Security posture

- No server-side credential storage.
- No committed secrets.
- No required environment variables.
- Browser permissions minimized with response headers.
- Optional provider keys can be cleared locally.
- Public/browser credentials are documented as non-secret and must be restricted at the provider.

## 17. Cloudflare acceptance checklist

- [ ] `npm install` succeeds.
- [ ] `npm run build` succeeds.
- [ ] Cloudflare Pages build command is `npm run build`.
- [ ] Cloudflare Pages output directory is `dist`.
- [ ] No `.env` values are required.
- [ ] `/` opens the separate landing page.
- [ ] `/simulator` opens the separate simulation workspace.
- [ ] 2D mode is functional.
- [ ] 3D mode is functional.
- [ ] Keyless demo works.
- [ ] Optional provider keys work when configured.
- [ ] Scenario lab works.
- [ ] Speed control works.
- [ ] One-hour rewind works.
- [ ] Fleet page works.
- [ ] Analytics page works.
- [ ] Public GitHub repository contains README and SPECS.

## 18. Provider references

Current provider/vendor documentation used for integration design:

- Cloudflare Pages build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare React deployment: https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- Cesium Google Maps integration: https://cesium.com/learn/cesiumjs/ref-doc/GoogleMaps.html
- Cesium photorealistic 3D Tiles: https://cesium.com/learn/cesiumjs-learn/cesiumjs-photorealistic-3d-tiles/
- Google Map Tiles API: https://developers.google.com/maps/documentation/tile/overview
- MapTiler API keys: https://docs.maptiler.com/cloud/api/authentication-key/
- Mapbox client/public tokens: https://docs.mapbox.com/help/getting-started/access-tokens/
- Stadia authentication: https://docs.stadiamaps.com/authentication/
- Stadia Alidade Satellite: https://docs.stadiamaps.com/map-styles/alidade-satellite/
- HERE Routing API v8: https://docs.here.com/routing/docs/routing-v8-intro
- OSM tile usage policy: https://operations.osmfoundation.org/policies/tiles/

Provider pricing, quotas, terms and eligibility change over time; verify current terms in the provider documentation before a public/demo deployment.
