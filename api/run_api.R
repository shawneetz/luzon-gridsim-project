# Starts the API on http://localhost:8000
# How to run:   Rscript run_api.R   (from any folder)

# make sure the working folder is this file's folder, so plumber.R can find the R/ folder
args <- commandArgs(trailingOnly = FALSE)
thisFile <- sub("--file=", "", args[grep("--file=", args)])
if (length(thisFile) == 1) setwd(dirname(thisFile))

library(plumber)

options(scipen = 999)      # never use scientific notation like 3.39e+04

pr("plumber.R") |> pr_run(host = "127.0.0.1", port = 8000)
