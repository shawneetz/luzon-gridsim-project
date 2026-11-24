# Luzon GridSim

by Shawn Alfred Padilla, UPLB BSCS batch 2025

Luzon GridSim finds the cheapest way to run the Luzon power grid for one day. Pick the plant groups, optionally set a daily CO₂ limit, then press **Solve**.

It is a CMSC 150 final project. The solver is written by hand with the simplex method (minimization through the dual), with no optimization library.

## Parts

- **R API** (`api/`) solves the problem
- **Next.js web app** (`src/`) takes the choices and shows the results

All plant data and limits live in `api/R/data.R`. There is no csv or spreadsheet to load.

## Requirements

- [R](https://www.r-project.org/)
- [Node.js](https://nodejs.org/) 20.9 or newer

## Setup

Open a terminal in the `next-app` folder.

```bash
Rscript -e 'install.packages(c("plumber", "jsonlite"))'
npm install
```

## Run

Keep both parts running in two terminals, both started from `next-app`.

**Terminal 1, the solver** (runs at `http://localhost:8000`):

```bash
cd api
Rscript run_api.R
```

**Terminal 2, the web app:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use another solver address, create `.env.local` with `API_URL=http://your-address` and restart the web app.

## How to use

1. press **Start Simulation**
2. click plant slots to select them (**Check All** and **Reset** help)
3. optionally turn on **Limit daily CO₂** and type a limit in t/day
4. press **Solve**
5. read the **Results** tab, then step through each iteration in the **Simplex Tableau** tab

The price of electricity in a block is the shadow price `S` of that block's demand constraint divided by 4 hours.

## Troubleshooting

| problem | fix |
| --- | --- |
| page says it cannot reach the solver | start Terminal 1 (the R API) |
| browser cannot open the page | start Terminal 2 (the web app) |
| the solver cannot find its files | run the commands from the `next-app` folder as shown |

## More docs

- [DATA-PIPELINE.md](./DATA-PIPELINE.md) shows how data moves from the model to the page

The look is a pixel, Minecraft-style interface (not affiliated with Mojang or Microsoft). Design tokens live in `src/app/globals.css`.

## References

- Next.js, getting started: https://nextjs.org/docs/app/getting-started
- Plumber, R web APIs: https://www.rplumber.io
- Next.js, environment variables: https://nextjs.org/docs/app/guides/environment-variables