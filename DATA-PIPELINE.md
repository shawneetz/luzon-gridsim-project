# Luzon GridSim Data Pipeline

## Overview

The R solver takes the user's choices plus built-in plant data, runs the simplex method, and returns one JSON answer. The browser keeps that answer in page state and draws it. Nothing is saved.

## Where the data comes from

All model data is written in `api/R/data.R`:

- plant groups, capacities, costs and CO₂ factors
- 6 time blocks and the demand of each block
- solar and wind availability
- limits: coal minimum and ramp, hydro energy, default CO₂ cap

The user adds two inputs in the page:

- which plant groups to include
- whether the CO₂ cap is on, and its value

## Data flow

```text
data.R  (built-in data)
   |
plumber.R  (GET /options, POST /solve)
   |                         ^
   |                         |  src/lib/api.ts
   v                         |
solve.R  --> check.R         |
         --> primal.R        |
         --> initial.R       |
         --> simplex.R       |
         --> results.R       |
   |                         |
   v                         |
JSON response ---------> src/app/page.tsx
                              |
                              +--> ResultsTab  (chart, prices, table, insights)
                              +--> TableauTab  (every simplex step)
```

Browser requests go to `/next-app/api/...`. `next.config.ts` forwards them to the R API (`http://localhost:8000`, or `API_URL` if set).

## Step by step

1. the page loads and calls `GET /options` to get the group names and default CO₂ cap
2. the user picks groups and the CO₂ cap; `lib/validate.ts` checks the cap in the browser
3. **Solve** sends `groups`, `co2On` and `co2Cap` to `POST /solve`
4. `check.R` rejects bad input (`status: "invalid"`)
5. `primal.R` builds the constraints and the cost row
6. `initial.R` transposes them into the dual and adds slack variables
7. `simplex.R` pivots until the bottom row has no negatives, saving every step
8. `results.R` reads cost, dispatch and prices from the final tableau
9. `solve.R` packs everything into one JSON answer
10. the page shows it

## JSON answer

| field | when it exists |
| --- | --- |
| `status` | always: `optimal`, `infeasible`, `invalid` or `error` |
| `message` | invalid, infeasible or error |
| `iterations`, `setup`, `tableaus` | optimal or infeasible |
| `cost`, `dispatch`, `prices` | optimal only |

Each item in `tableaus` has row names, column names, values, the basic solution, and the pivot row and column it used (the final step has no pivot). Pivot indexes are 0-based in the JSON.

## What the frontend does with it

| file | job |
| --- | --- |
| `lib/api.ts` | calls the API |
| `lib/types.ts` | describes the request and response shapes |
| `lib/validate.ts` | checks the CO₂ cap before sending |
| `lib/insights.ts` | works out cheapest block, energy per group, total CO₂ |
| `lib/dispatchTable.ts` | works out total supply and full-capacity cells |
| `lib/format.ts` | formats numbers and pesos |
| `components/ResultsTab.tsx` | lays out the results |
| `components/TableauTab.tsx` | steps through the tableaus |

## Keep in sync

The frontend keeps its own copy of a few values for display only. If you change `data.R`, update these too:

| R value (`data.R`) | frontend copy |
| --- | --- |
| `demand` | `lib/grid.ts` |
| `hoursPerBlock` | `lib/grid.ts` (`HOURS_PER_BLOCK`) |
| `capacity`, `emission` | `lib/plants.ts` |

The solver always uses the R values.

## Errors

- bad input: the API answers `invalid` and the page shows the message
- no solution: the API answers `infeasible` and the page shows "You Died!" with help
- crash in R: `plumber.R` catches it and answers `error` with a short message
- API not reachable: the page shows a "Connection lost" banner with a retry button

## References

- Plumber, rendering output and serializers: https://www.rplumber.io/articles/rendering-output.html
- jsonlite, `toJSON`: https://jeroen.cran.dev/jsonlite/reference/toJSON.html
- Next.js, rewrites: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
- CMSC 150 laboratory topic 5, simplex method