# CHECK THE INPUT

# Returns a message if the input is bad, or NULL if it is fine
checkInput <- function(selGroups, co2On, co2Cap) {

  # no group selected -> do not solve
  if (length(selGroups) == 0) {
    return("Please select at least one plant group.")
  }

  # the CO2 cap only matters when it is switched ON
  if (isTRUE(co2On)) {
    # turn the input into a number; text becomes NA as.numeric
    capValue <- suppressWarnings(as.numeric(co2Cap))
    # blank, not a number, or 0 or less -> do not solve
    if (length(capValue) != 1 || is.na(capValue) || capValue <= 0) {
      return("The CO2 cap must be a number greater than 0.")
    }
  }

  # everything is fine
  return(NULL)
}
