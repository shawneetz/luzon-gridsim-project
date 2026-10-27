# BUILD THE INITIAL TABLEAU (the dual)

# Transpose the primal matrix, then add slack variables 
buildInitial <- function(primalInfo) {
  
  primal <- primalInfo$primal
  m <- primalInfo$nCons      # number of primal constraints = number of dual variables S1..Sm
  n <- primalInfo$nVar       # number of primal unknowns = number of dual constraints and slacks
  
  # transpose the matrix
  transposed <- t(primal)
  
  # the first n rows of the transpose are the dual constraints
  # Their RHS is the primal cost. The last row is the dual objective (the primal RHS)
  dualCoefs <- transposed[1:n, 1:m, drop = FALSE]
  dualRHS   <- transposed[1:n, m + 1]
  dualObj   <- transposed[n + 1, 1:m]
  
  # add one slack variable for each dual constraint (an identity matrix)
  # Column order: S1..Sm, slacks, Z, Solution 
  top <- cbind(dualCoefs, diag(n), rep(0, n), dualRHS)
  
  # bottom row = -(objective numbers), 0 for the slacks, 1 for Z, 0 for Solution
  bottom <- c(-dualObj, rep(0, n), 1, 0)
  tableau <- rbind(top, bottom)
  
  # name the rows and columns. The slacks are named after the primal unknowns 
  colnames(tableau) <- c(paste0("S", 1:m), primalInfo$varNames, "Z", "Solution")
  rownames(tableau) <- c(primalInfo$varNames, "Z")
  
  return(tableau)
}
