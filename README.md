# Luzon Grid Dispatch and Price Simulator

The Next.js UI in this app talks to the R plumber solver in the workspace `api` folder. The API defaults to `http://localhost:8000`; Next.js forwards `/next-app/api/*` requests to it to avoid browser CORS configuration.

## Run the apps

Install the R dependencies once:

```bash
Rscript -e 'install.packages(c("plumber", "jsonlite"))'
```

In one terminal, start the solver:

```bash
cd ..\api
Rscript run_api.R
```

In another terminal, start the UI:

```bash
npm install
npm run dev
```

Open http://localhost:3000. If the R API runs at another address, copy `.env.example` to `.env.local` and set `API_URL`.

The R API implements dispatch optimization with a hand-written simplex method. Plant data and limits are in `../api/R/data.R`; the UI is in `src/app`, `src/components`, and `src/lib`.
