# BUILD THE PRIMAL TABLEAU

# Rows = constraints, last row = objective, columns = unknowns + RHS 
# Every constraint is written in the >= form because this is a minimization 
buildPrimal <- function(selGroups, co2On, co2Cap) {
  
  # keep the selected groups in Table 1 order 
  groups <- groupNames[groupNames %in% selGroups]
  
  # make one unknown x_gt for each selected group and block, group by group 
  varNames <- character(0)
  for (g in groups) {
    varNames <- c(varNames, paste0(groupTags[g], blockNames))
  }
  nVar <- length(varNames)
  
  # helper: gives the column number of x_gt 
  colOf <- function(g, t) {
    return(match(paste0(groupTags[g], blockNames[t]), varNames))
  }
  
  # start with an empty constraint matrix (unknowns + 1 RHS column)
  conRows <- matrix(0, nrow = 0, ncol = nVar + 1)
  conLabels <- character(0)
  
  # add the constraints one group at a time
  # Each constraint is a row of numbers: the last number is the RHS
  
  # (1) Demand: sum of x_gt over the groups >= D_t 
  for (t in 1:nBlocks) {
    row <- rep(0, nVar + 1)                  # all zeros first 
    for (g in groups) {
      row[colOf(g, t)] <- 1                  # each selected group counts once
    }
    row[nVar + 1] <- demand[t]               # RHS is the demand
    conRows <- rbind(conRows, row)           # add the row 
    conLabels <- c(conLabels, paste0("(1) Demand ", blockNames[t]))
  }
  
  # (2) Capacity: x_gt <= Cap_g * a_gt
  # multiply both sides by -1 so it becomes: -x_gt >= -(Cap_g * a_gt) 
  for (g in groups) {
    for (t in 1:nBlocks) {
      row <- rep(0, nVar + 1)
      row[colOf(g, t)] <- -1
      row[nVar + 1] <- -(capacity[g] * avail[g, t])
      conRows <- rbind(conRows, row)
      conLabels <- c(conLabels, paste0("(2) Capacity ", g, " ", blockNames[t]))
    }
  }
  
  # Coal constraints, only if Coal is selected
  if ("Coal" %in% groups) {
    
    # (3) Coal minimum: x_Coal,t >= 0.40 * Cap_Coal
    for (t in 1:nBlocks) {
      row <- rep(0, nVar + 1)
      row[colOf("Coal", t)] <- 1
      row[nVar + 1] <- coalMinShare * capacity["Coal"]
      conRows <- rbind(conRows, row)
      conLabels <- c(conLabels, paste0("(3) Coal minimum ", blockNames[t]))
    }
    
    # (4) Coal ramping for t = 2 to 6. Two rows per block: one for rising, one for falling
    for (t in 2:nBlocks) {
      # rise: x_t - x_(t-1) <= R   becomes   -x_t + x_(t-1) >= -R
      row <- rep(0, nVar + 1)
      row[colOf("Coal", t)] <- -1
      row[colOf("Coal", t - 1)] <- 1
      row[nVar + 1] <- -rampLimit
      conRows <- rbind(conRows, row)
      conLabels <- c(conLabels, paste0("(4) Coal ramp up ", blockNames[t - 1], " to ", blockNames[t]))
      
      # fall: x_(t-1) - x_t <= R   becomes   x_t - x_(t-1) >= -R
      row <- rep(0, nVar + 1)
      row[colOf("Coal", t)] <- 1
      row[colOf("Coal", t - 1)] <- -1
      row[nVar + 1] <- -rampLimit
      conRows <- rbind(conRows, row)
      conLabels <- c(conLabels, paste0("(4) Coal ramp down ", blockNames[t - 1], " to ", blockNames[t]))
    }
  }
  
  # (5) Hydro water, only if Hydro is selected [P: Constraint 5]
  # h * (sum of x_Hydro,t) <= E   becomes   -h * (sum of x_Hydro,t) >= -E
  if ("Hydro" %in% groups) {
    row <- rep(0, nVar + 1)
    for (t in 1:nBlocks) {
      row[colOf("Hydro", t)] <- -hoursPerBlock
    }
    row[nVar + 1] <- -hydroEnergy
    conRows <- rbind(conRows, row)
    conLabels <- c(conLabels, "(5) Hydro water")
  }
  
  # (6) CO2 cap, only if the toggle is ON [P: Constraint 6] 
  # sum of (h * e_g * x_gt) <= cap   becomes   -sum of (h * e_g * x_gt) >= -cap
  if (isTRUE(co2On)) {
    row <- rep(0, nVar + 1)
    for (g in groups) {
      for (t in 1:nBlocks) {
        row[colOf(g, t)] <- -(hoursPerBlock * emission[g])
      }
    }
    row[nVar + 1] <- -as.numeric(co2Cap)
    conRows <- rbind(conRows, row)
    conLabels <- c(conLabels, "(6) CO2 cap")
  }
  
  # make the objective row: Z = sum of (h * c_gt * x_gt) 
  objRow <- rep(0, nVar)
  for (g in groups) {
    for (t in 1:nBlocks) {
      objRow[colOf(g, t)] <- hoursPerBlock * cost[g, t]
    }
  }
  
  # put the objective in the last row. Its RHS is Z, so 0 is only a placeholder 
  primal <- rbind(conRows, c(objRow, 0))
  rownames(primal) <- c(conLabels, "Objective Z")
  colnames(primal) <- c(varNames, "RHS")
  
  return(list(primal = primal,
              varNames = varNames,
              groups = groups,
              nVar = nVar,
              nCons = length(conLabels)))
}
