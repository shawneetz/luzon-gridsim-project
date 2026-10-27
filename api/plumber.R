# PLUMBER API (thin wrapper). All the logic is in the R/ folder.

source("R/data.R")
source("R/check.R")
source("R/primal.R")
source("R/initial.R")
source("R/simplex.R")
source("R/results.R")
source("R/solve.R")

#* Plant groups and the default CO2 cap, so the UI does not hardcode them
#* @get /options
#* @serializer json list(auto_unbox = TRUE)
function() {
  return(list(groups = groupNames, defaultCo2Cap = defaultCo2Cap))
}

#* Solve the dispatch problem
#* @post /solve
#* @serializer json list(auto_unbox = TRUE, digits = NA)
function(req) {

  # never crash and never show raw error messages [P: Failure Cases]
  tryCatch({
    body <- req$body

    selGroups <- as.character(unlist(body$groups))
    co2On <- isTRUE(body$co2On)
    co2Cap <- if (is.null(body$co2Cap)) "" else body$co2Cap

    solveDispatch(selGroups, co2On, co2Cap)
  }, error = function(e) {
    list(status = "error", message = "Something went wrong while solving. Please try again.")
  })
}
