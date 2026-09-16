# SvacchSanchar

<div align="center">

### Bengaluru · Municipal Digital Twin · PS13

**OBSERVE → SIMULATE → RE-OPTIMIZE → MEASURE**

</div>

---

## The idea

**SvacchSanchar** is a living digital twin of Bengaluru's municipal waste collection network. It is built to feel like a premium city-operations product rather than a dashboard with a map attached.

The application has two operating perspectives:

```text
                     SVACCHSANCHAR
                           │
              ┌────────────┴────────────┐
              │                         │
           2D MODE                  3D MODE
        operations view          Eye-of-God view
              │                         │
              └────────────┬────────────┘
                           │
                    SAME TWIN STATE
                           │
            ┌──────────────┼──────────────┐
            │              │              │
          BINS           FLEET         ROADS
            │              │              │
            └──────────────┼──────────────┘
                           │
                     ROUTING ENGINE
                           │
                    SCENARIO ENGINE
                           │
                    ANALYTICS / IMPACT
```

## What you can actually do

| Area | Experience |
|---|---|
| **Live Twin** | Explore Bengaluru from 2D operational view or immersive 3D perspective. |
| **120,000 bins** | Large municipal-scale synthetic fleet demand model, rendered as GPU-friendly point primitives. |
| **512 trucks** | Real moving fleet entities with capacity, load, route and status. |
| **Routing** | Fixed-route control vs dynamic demand-aware multi-truck optimization. |
| **Simulation clock** | Pause, resume, accelerate, fast-forward and rewind the last hour. |
| **Time + season** | Demand changes by time-of-day and seasonal profile. |
| **Scenario Lab** | Create waste surges, breakdowns, road closures, slowdowns, sensor failures, heavy rain and compound events. |
| **Analytics** | Compare distance, time, fleet utilization, critical bins and projected overflow. |
| **Provider Center** | Bring your own optional map/3D/provider credentials. |
| **Data** | Export/import local snapshots and inspect the client-side model. |

## The visual language

The product deliberately avoids the common “AI dashboard” look.

```text
minimal spacing    +    restrained glass    +    neutral palette

       typography              subtle motion

                         ↓

             premium / Apple-esque product feel
```

Light and dark themes are native. Glass is used for framing and controls, not as decoration everywhere. The map/city is the spectacle; the interface stays quiet.

## Key technical properties

- **Browser-native**: no application server.
- **No database**: deterministic local data + in-browser state.
- **No mandatory secrets**: core mode works with zero credentials.
- **Cloudflare Pages**: designed for a static Vite deployment.
- **Client-side providers**: users can bring their own optional browser-safe/public credentials.
- **Deterministic simulation**: the same starting state can be replayed.
- **Large-scale rendering**: 120k bins use Cesium point primitives instead of 120k heavyweight entities.

## Optional provider upgrades

The application includes a local-only provider center for:

- Google Maps Platform — photorealistic 3D tiles.
- Cesium ion — terrain / hosted assets.
- MapTiler — streets and satellite imagery.
- Mapbox — streets and satellite imagery.
- Stadia Maps — smooth, dark and satellite raster styles.
- HERE — optional route validation.
- TomTom — optional traffic connector.
- openrouteservice — optional route validation.

The default experience does not depend on any of them.

## Product pages

```text
/               Landing / Earth-scale introduction
/simulator      Live Bengaluru digital twin
/fleet          Fleet command
/scenarios      Scenario laboratory
/analytics      Operational analytics
/data           Client-side data/model workspace
/providers      Provider center / BYO credentials
```

## Visual identity

### Hero principle

> **Start at Earth scale. Descend into the operational model.**

### Product principle

> **The city provides the spectacle. The interface provides the elegance.**

## Status

Hackathon implementation for **PS13 — Digital Twin for Municipal Solid Waste Collection Routing**.

For hosting, architecture, provider details and engineering notes, see [`SPECS.md`](./SPECS.md).
