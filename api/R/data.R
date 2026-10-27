# DATA from the project specification

# Plant groups, in the same order as Table 1
groupNames <- c("Coal", "Natural Gas", "Geothermal", "Hydro", "Oil-based", "Solar", "Wind")

# Short one-letter tag of each group, used to name the unknowns in the printed tables (Coal B1 -> cB1)
groupTags <- c("c", "n", "g", "h", "o", "s", "w")
names(groupTags) <- groupNames

# Blocks B1 to B6
blockNames <- c("B1", "B2", "B3", "B4", "B5", "B6")
nBlocks <- length(blockNames)

# Capacity of each group in MW
capacity <- c(7000, 3300, 800, 2500, 1500, 2500, 400)
names(capacity) <- groupNames

# CO2 emission factor in t CO2 per MWh
emission <- c(0.95, 0.40, 0.10, 0, 0.75, 0, 0)
names(emission) <- groupNames

# Operating cost in PHP per MWh: one row per group, one column per block
# Fuel plants come from Table 3. Hydro, Solar and Wind are the same in every block
costData <- c(3800,  3838,  3914,  3990,  3952,  3876,    # Coal
              6500,  6565,  6695,  6825,  6760,  6630,    # Natural Gas
              1500,  1515,  1545,  1575,  1560,  1530,    # Geothermal
              300,   300,   300,   300,   300,   300,     # Hydro
              14000, 14140, 14420, 14700, 14560, 14280,   # Oil-based
              40,    40,    40,    40,    40,    40,      # Solar
              60,    60,    60,    60,    60,    60)      # Wind
cost <- matrix(costData, nrow = 7, ncol = 6, byrow = TRUE)
rownames(cost) <- groupNames
colnames(cost) <- blockNames

# Demand in MW per block
demand <- c(6300, 8600, 11800, 12300, 14000, 10600)

# Availability a_gt: 1 for every group, except Solar and Wind
avail <- matrix(1, nrow = 7, ncol = 6)
rownames(avail) <- groupNames
colnames(avail) <- blockNames
avail["Solar", ] <- c(0, 0.10, 0.60, 0.55, 0.08, 0)
avail["Wind", ]  <- c(0.35, 0.30, 0.25, 0.25, 0.30, 0.35)

# Other constants [P: Mathematical Formulation]
hoursPerBlock <- 4        # h, hours in one block
coalMinShare  <- 0.40     # coal never runs below 40% of its capacity
rampLimit     <- 1500     # R, biggest coal change between two blocks (MW)
hydroEnergy   <- 8000     # E, most hydro energy per day (MWh)
defaultCo2Cap <- 165000   # default CO2 cap (t/day)
