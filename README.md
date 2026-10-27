# Luzon GridSim

Luzon GridSim helps find a low-cost way to meet electricity demand using different power-plant groups. Choose the groups, optionally set a daily CO₂ limit, and select **Solve** to see the plan.

The project has two parts:

- The **R API** calculates the plan.
- The **Next.js web app** lets you enter choices and view the results.

Plant data and limits are written in `api/R/data.R`. The solver does not load them from a spreadsheet or CSV file.

## What you need

Install these tools before you start:

- [R](https://www.r-project.org/)
- [Node.js](https://nodejs.org/)

## Set up the project

Open a terminal in the `next-app` folder.

Install the R packages once:

```bash
Rscript -e 'install.packages(c("plumber", "jsonlite"))'
```

Install the web app packages:

```bash
npm install
```

## Start the project

Keep both parts running in separate terminals.

### Terminal 1: Start the solver

From the `next-app` folder, run:

```bash
cd api
Rscript run_api.R
```

The API starts at `http://localhost:8000`.

### Terminal 2: Start the web app

From the `next-app` folder, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Change the API address

The web app sends requests to `http://localhost:8000` by default. To use a different address, copy `.env.example` to `.env.local` and change the `API_URL` value. Restart the web app after changing it.

## Where to look in the code

- `api/R/data.R` contains the plant data and limits.
- `api/R/` contains the functions that check inputs and calculate the plan.
- `api/plumber.R` provides the API endpoints.
- `src/app/` contains the main web page.
- `src/components/` contains the controls, results, and tables.
- `src/lib/` contains API request helpers, data types, and number formatting.

For a step-by-step explanation of how data moves from the model to the web page, see [DATA-PIPELINE.md](./DATA-PIPELINE.md).

## If something does not work

- If the page says it cannot reach the solver, make sure Terminal 1 is still running the R API.
- If the browser cannot open the page, make sure Terminal 2 is still running the web app.
- Check that you started both commands from the `next-app` folder as shown above.
