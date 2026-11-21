# SOLVE: runs the whole recipe and returns one list that the API turns into JSON

# turns one saved iteration into plain numbers and names for the UI
# the pivot is optional: the final iteration (and an infeasible stop) has none, so the
# two fields are left out instead of sent as NULL or NA, because jsonlite would turn
# NULL into {} and the frontend only accepts real numbers
# R counts from 1 and the frontend counts from 0, so 1 is taken away
# as.integer also drops the name that which.min leaves on the pivot column,
# so it is sent as a plain number and not as a named value
formatStep <- function(step) {
  out <- list(iteration = step$iteration,
              rowNames = rownames(step$tableau),
              colNames = colnames(step$tableau),
              values = unname(clean(step$tableau)),
              basic = unname(clean(step$basic)))

  if (!is.null(step$pivotRow) && !is.null(step$pivotCol)) {
    out$pivotRow <- as.integer(step$pivotRow) - 1L
    out$pivotCol <- as.integer(step$pivotCol) - 1L
  }

  return(out)
}

solveDispatch <- function(selGroups, co2On, co2Cap) {

  # check the input
  msg <- checkInput(selGroups, co2On, co2Cap)
  if (!is.null(msg)) {
    return(list(status = "invalid", message = msg))
  }

  # build the primal tableau, then the initial tableau (transpose + slack variables)
  primalInfo <- buildPrimal(selGroups, co2On, co2Cap)
  initialTableau <- buildInitial(primalInfo)

  # run Simplex
  out <- Simplex(initialTableau)

  # what the UI needs in every case
  response <- list(status = out$status,
                   iterations = out$iterations,
                   setup = list(unknowns = primalInfo$nVar, constraints = primalInfo$nCons),
                   tableaus = lapply(out$steps, formatStep))

  # the answers only exist when an optimal solution was found
  if (out$status == "optimal") {
    response <- c(response, getResults(primalInfo, out$finalTableau))
  } else {
    response$message <- "The problem is infeasible."
  }

  return(response)
}

# references:
# r, is.null: https://stat.ethz.ch/R-manual/R-devel/library/base/html/NULL.html
# r, as.integer (drops names): https://stat.ethz.ch/R-manual/R-devel/library/base/html/integer.html
# jsonlite, how NULL and NA are converted (toJSON): https://jeroen.cran.dev/jsonlite/reference/toJSON.html
# plumber, serializers (auto_unbox): https://www.rplumber.io/articles/rendering-output.html