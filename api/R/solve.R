# SOLVE: runs the whole recipe and returns one list that the API turns into JSON

# turns one saved iteration into plain numbers and names for the UI
formatStep <- function(step) {
  return(list(iteration = step$iteration,
              rowNames = rownames(step$tableau),
              colNames = colnames(step$tableau),
              values = unname(clean(step$tableau)),
              basic = unname(clean(step$basic))))
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
