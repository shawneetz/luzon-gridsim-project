# Luzon GridSim Data Pipeline

## Overview

Luzon GridSim combines built-in power-plant data with the user's choices to find a low-cost way to meet electricity demand. The R solver calculates a plan, then sends the answer and its working steps to the web page. The user can review the plan and the simplex steps in the browser.

## Data Flow Architecture (File to File)

### Where the data comes from

The project does not import plant data from CSV, Excel, or another data file. Instead, `api/R/data.R` contains the model data directly in R code:

- Plant-group names and short labels.
- Six time blocks and the electricity demand for each block.
- Each group's capacity, operating cost, and CO₂ emissions.
- Solar and wind availability in each block.
- Model limits, such as the coal ramp limit, hydro energy limit, and default CO₂ cap.

The user adds two more inputs in the web page:

- Which plant groups to include.
- Whether to enforce a CO₂ cap and, if enabled, the cap amount.

### How data moves through the files

```text
api/R/data.R
  Built-in plant data, demand, costs, and limits
        |
        v
api/plumber.R
  Loads the R files and provides /options and /solve
        |
        +---- GET /options ----> plant groups and default CO₂ cap
        |                              |
        |                              v
        |                       src/app/page.tsx
        |                       displays the controls
        |
        <---- POST /solve <---- src/lib/api.ts
        |                       sends the user's choices
        v
api/R/solve.R
  Coordinates the calculation
        |
        +--> api/R/check.R
        +--> api/R/primal.R
        +--> api/R/initial.R
        +--> api/R/simplex.R
        +--> api/R/results.R
        |
        v
JSON response returned by the API
        |
        v
src/app/page.tsx
        |
        +--> src/components/ResultsTab.tsx
        +--> src/components/TableauTab.tsx
                  |
                  v
          src/components/DataTable.tsx
```

`api/plumber.R` loads the solver files when the API starts. `api/run_api.R` starts that API at `127.0.0.1:8000`. The Next.js rewrite in `next.config.ts` forwards browser requests from `/next-app/api/` to the R API. Set `API_URL` to change the API address.

### Intermediate data and final output

The solver keeps its working data in memory while it runs. It does not write intermediate tables or results to disk.

1. `buildPrimal()` creates a matrix of the problem's rules and costs.
2. `buildInitial()` creates the starting simplex tableau. A tableau is a grid of numbers the solver updates as it searches for an answer.
3. `Simplex()` creates updated tableaus and saves each step in a list.
4. `getResults()` reads the final cost, plant outputs, and prices from the final tableau when the solver finds an optimal answer.
5. `solveDispatch()` gathers the results into an R list. Plumber sends that list to the browser as JSON.

The project generates **no output files** for a solve. Its final output is a JSON response sent over the API connection. The browser keeps that response in page state and displays it. The response may include the solve status, counts, saved tableaus, total cost, plant dispatch, and block prices. Some results only appear when an optimal solution exists.

## Core Functions & Logic

### Loading model data

#### `api/R/data.R`

This file defines values rather than a processing function.

- **Inputs:** Values written directly in the R file.
- **Processing:** Creates named lists, vectors, and matrices for plant groups, costs, capacities, emissions, availability, demand, and limits.
- **Outputs:** R variables used by the API and solver. The file reads no external data files.

### Serving choices and solve requests

#### `/options` in `api/plumber.R`

- **Inputs:** No user data.
- **Processing:** Reads the available group names and default CO₂ cap already loaded from `data.R`.
- **Outputs:** JSON with `groups` and `defaultCo2Cap`. The page uses this to build its controls.

#### `/solve` in `api/plumber.R`

- **Inputs:** A JSON request containing `groups`, `co2On`, and `co2Cap`.
- **Processing:** Reads those values and passes them to `solveDispatch()`. If an unexpected error occurs, it returns a general error message.
- **Outputs:** A JSON response with the solver's status and, when available, the results and tableau steps.

### Checking and solving the problem

#### `checkInput(selGroups, co2On, co2Cap)` in `api/R/check.R`

- **Inputs:** The selected plant groups, the CO₂ switch, and the CO₂ cap value.
- **Processing:** Requires at least one group. When the CO₂ switch is on, it also requires a numeric cap greater than zero.
- **Outputs:** Returns no message when the inputs pass. Otherwise, returns a message that `solveDispatch()` sends back with an `invalid` status.

#### `buildPrimal(selGroups, co2On, co2Cap)` in `api/R/primal.R`

- **Inputs:** The selected groups and the CO₂ settings, plus the model data from `data.R`.
- **Processing:** Creates one unknown for each selected plant group in each time block. Adds rules for meeting demand and staying within capacity. It adds coal minimum and ramp rules when Coal is selected, the hydro energy rule when Hydro is selected, and the emissions rule when the CO₂ cap is on. It also sets each plant's operating cost.
- **Outputs:** A list containing the problem matrix (`primal`), variable names, selected groups, and counts of unknowns and constraints.

#### `buildInitial(primalInfo)` in `api/R/initial.R`

- **Inputs:** The problem matrix and its counts and variable names from `buildPrimal()`.
- **Processing:** Rearranges the problem matrix and adds extra columns that let the simplex method track its progress.
- **Outputs:** The initial tableau, ready for the solver.

#### `readBasic(tableau)` in `api/R/simplex.R`

- **Inputs:** A tableau.
- **Processing:** Checks each column to find values that currently have a clear solution in the tableau.
- **Outputs:** A named vector of the current basic values. `Simplex()` saves it with each step; `getResults()` also uses it to find demand shadow values.

#### `Simplex(tableau)` in `api/R/simplex.R`

- **Inputs:** The initial tableau.
- **Processing:** Saves the current tableau, selects a column and row to update, and performs the update. It repeats until it finds an optimal answer or cannot make a valid next move.
- **Outputs:** The status (`optimal` or `infeasible`), iteration count, final tableau, and a list of saved steps.

### Preparing the response

#### `clean(x, digits)` in `api/R/results.R`

- **Inputs:** A number or numeric array and the number of decimal places to keep.
- **Processing:** Rounds the values and removes negative zero.
- **Outputs:** Cleaned numbers for the API response.

#### `getResults(primalInfo, finalTableau)` in `api/R/results.R`

- **Inputs:** The problem details and final tableau.
- **Processing:** Reads the minimum total cost, plant output in each block, and electricity prices. It rounds the results for display.
- **Outputs:** A list with `cost`, `dispatch`, and `prices`. The API includes this only for an optimal solution.

#### `formatStep(step)` in `api/R/solve.R`

- **Inputs:** One saved simplex step.
- **Processing:** Converts its row names, column names, values, and basic values into simple arrays.
- **Outputs:** A named step that can be included in the JSON response.

#### `solveDispatch(selGroups, co2On, co2Cap)` in `api/R/solve.R`

- **Inputs:** The user's selections and CO₂ settings.
- **Processing:** Runs `checkInput()`, `buildPrimal()`, `buildInitial()`, and `Simplex()` in order. It formats the saved steps. If the solver succeeds, it also calls `getResults()`.
- **Outputs:** One response list. It contains a status and may contain a message, iteration count, problem size, tableaus, cost, dispatch, and prices.

## Frontend Integration

### Loading the controls

1. `src/app/page.tsx` calls `fetchOptions()` in `src/lib/api.ts` when the page loads.
2. `fetchOptions()` requests `/next-app/api/options`.
3. `next.config.ts` forwards the request to `/options` on the R API.
4. The API returns the plant groups and default CO₂ cap as JSON.
5. The page selects all groups and fills in the default cap. `src/components/ControlPanel.tsx` displays the checkboxes and CO₂ controls.

If the API is unavailable, the page displays a connection warning.

### Sending the user's choices

1. The user changes the controls in `ControlPanel.tsx`.
2. `src/app/page.tsx` stores the chosen groups, CO₂ switch, and cap in page state.
3. When the user presses Solve, the page calls `solve()` in `src/lib/api.ts`.
4. `solve()` sends the three values as JSON to `/next-app/api/solve`.
5. Next.js forwards the request to the R API. The API returns the solver response as JSON.
6. The page stores the response, then opens the Results tab. If the API request fails, the page shows a connection error.

`src/lib/types.ts` describes the request and response fields so the TypeScript code can use them consistently.

### Showing the results

- `src/components/ResultsTab.tsx` shows whether the problem is optimal, infeasible, invalid, or in error.
- For an optimal answer, it shows the total cost, iteration count, number of unknowns and constraints, plant output by group and block, and price by block.
- `src/components/TableauTab.tsx` lets the user move through the saved simplex steps. The page enables this tab when steps are present.
- Both views use `src/components/DataTable.tsx` to display rows and columns.
- `src/lib/format.ts` adds readable number formatting and the peso sign to monetary values.

All of these views use the JSON response held in the page. The frontend does not create or download a results file.
