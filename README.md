# Luzon GridSim

Luzon GridSim finds the cheapest way to run the Luzon grid for one day. Pick the power plant groups, optionally set a daily CO₂ limit, then press **Solve**. It is a CMSC 150 final project: the solver is written by hand with the simplex method (minimization through the dual), with no optimization library.

The project has two parts:

- the **R API** (`api/`) solves the problem
- the **Next.js web app** (`src/`) takes the choices and shows the results

Plant data and limits live in `api/R/data.R`. There is no spreadsheet or csv to load.

## What you need

- [R](https://www.r-project.org/)
- [Node.js](https://nodejs.org/)

## Set up

Open a terminal in the `next-app` folder.

```bash
Rscript -e 'install.packages(c("plumber", "jsonlite"))'
npm install
```

## Run

Keep both parts running in separate terminals, both started from the `next-app` folder.

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

To use a different api address, copy `.env.example` to `.env.local`, change `API_URL`, and restart the web app.

## How to use it

1. press **Start Simulation** on the title screen
2. click plant slots to select them (**Check All** and **Reset** help)
3. optionally switch on **Limit daily CO₂** and type a limit in t/day
4. press **Solve**
5. read the **Results** tab, then step through every iteration in the **Simplex Tableau** tab

Price of electricity per block = shadow price `S` of that block's demand constraint, divided by 4 hours.

## Design

The look is a pixel, Minecraft-style interface (not affiliated with Mojang or Microsoft). Plant groups are inventory slots, the iteration navigator is an xp bar, and an infeasible problem shows "You Died!".

- design tokens (colors, fonts, sizes, shadows, animations): `src/app/globals.css`
- the ui revamp plan and every design decision: [TASKS.md](./TASKS.md)
- why we built it this way, for the demo: [PRESENTATION-NOTES.md](./PRESENTATION-NOTES.md)
- how each part of the code works: [TECHNICAL-DOCS.md](./TECHNICAL-DOCS.md)
- how data moves from the model to the page: [DATA-PIPELINE.md](./DATA-PIPELINE.md)

## If something does not work

- the page says it cannot reach the solver: Terminal 1 (the R API) is not running
- the browser cannot open the page: Terminal 2 (the web app) is not running
- start both commands from the `next-app` folder as shown above