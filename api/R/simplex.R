# SIMPLEX

# Reads the basic solution of a tableau, column by column
readBasic <- function(tableau) {
  rows <- nrow(tableau)
  cols <- ncol(tableau)
  tol <- 1e-9                                   # ignore tiny rounding noise

  basic <- rep(0, cols - 1)
  names(basic) <- colnames(tableau)[1:(cols - 1)]

  for (j in 1:(cols - 1)) {
    # rows where this column is not zero
    nonZero <- which(abs(tableau[, j]) > tol)

    # exactly one non-zero value -> answer = Solution / that value
    # more than one non-zero value (or none) -> the answer stays 0
    if (length(nonZero) == 1) {
      basic[j] <- tableau[nonZero, cols] / tableau[nonZero, j]
    }
  }
  return(basic)
}

# Runs the Simplex method on the initial tableau
# Instead of printing, it keeps every tableau and its basic solution in "steps" so the UI can show them
Simplex <- function(tableau) {

  rows <- nrow(tableau)
  cols <- ncol(tableau)
  tol <- 1e-9                                   # tiny number to ignore rounding noise
  iterations <- 0
  status <- "optimal"
  steps <- list()

  # Repeat the steps below until the bottom row has no negative number
  repeat {

    # save this iteration (iteration 0 is the initial tableau)
    steps[[iterations + 1]] <- list(iteration = iterations,
                                    tableau = tableau,
                                    basic = readBasic(tableau))

    # look at the bottom row, without the Solution column
    bottomRow <- tableau[rows, 1:(cols - 1)]

    # if no negative number is left, we are done
    if (all(bottomRow >= -tol)) {
      break
    }

    # pivot column = the most negative number in the bottom row
    # which.min gives the first one if there is a tie (my decision, so results can be repeated)
    pivotCol <- which.min(bottomRow)

    # test ratio = Solution / pivot column value, only for positive values
    colValues <- tableau[1:(rows - 1), pivotCol]
    solValues <- tableau[1:(rows - 1), cols]
    testRatio <- rep(NA, rows - 1)
    positive <- colValues > tol
    testRatio[positive] <- solValues[positive] / colValues[positive]

    # no test ratio to choose from -> the problem is infeasible
    if (all(is.na(testRatio))) {
      status <- "infeasible"
      break
    }

    # pivot row = the smallest positive test ratio (the first one if tied)
    pivotRow <- which.min(testRatio)
    pivotElement <- tableau[pivotRow, pivotCol]

    # Gauss-Jordan. First, normalize the pivot row: nPR = PR / PE
    normRow <- tableau[pivotRow, ] / pivotElement
    tableau[pivotRow, ] <- normRow

    # make the other rows zero in the pivot column: R_i = R_i - (nPR * C)
    for (i in 1:rows) {
      if (i == pivotRow) next                   # skip the pivot row
      valueToElim <- tableau[i, pivotCol]       # C, the number we want to make zero
      if (valueToElim == 0) next                # already zero
      tableau[i, ] <- tableau[i, ] - normRow * valueToElim
    }

    # the pivot column variable is now the basic variable of this row
    rownames(tableau)[pivotRow] <- colnames(tableau)[pivotCol]

    # count the iteration and go back to the top
    iterations <- iterations + 1
  }

  return(list(status = status, iterations = iterations, finalTableau = tableau, steps = steps))
}
