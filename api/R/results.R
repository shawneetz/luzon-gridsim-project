# READ THE ANSWERS FROM THE FINAL TABLEAU

# drops tiny rounding noise and negative zeros so the numbers look clean in the UI
clean <- function(x, digits = 4) {
  return(round(x, digits) + 0)
}

# Reads the minimum cost, the dispatch x_gt and the prices from the final tableau
getResults <- function(primalInfo, finalTableau) {

  rows <- nrow(finalTableau)
  cols <- ncol(finalTableau)
  groups <- primalInfo$groups

  # the minimum cost Z is the bottom right cell
  Z <- finalTableau[rows, cols]

  # the dispatch x_gt comes from the bottom row, under the columns named after the unknowns
  # the unknowns are listed group by group, so every 6 values are one group
  x <- finalTableau[rows, primalInfo$varNames]
  dispatch <- matrix(x, nrow = length(groups), ncol = nBlocks, byrow = TRUE)

  # the shadow prices S_i come from the basic solution (the Solution column), one per constraint
  # S1 to S6 belong to the demand constraints of B1 to B6, and price_t = S_t / h
  basic <- readBasic(finalTableau)
  shadow <- basic[paste0("S", 1:nBlocks)]
  prices <- shadow / hoursPerBlock

  return(list(cost = clean(Z, 2),
              dispatch = list(groups = as.list(groups),   # as.list keeps a single group as a JSON array
                              blocks = blockNames,
                              values = unname(clean(dispatch))),
              prices = list(blocks = blockNames,
                            values = unname(clean(prices, 2)))))
}
