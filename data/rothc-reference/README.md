# RothC reference run (Rothamsted Research)

These files are copied unchanged from the official Python release of RothC:

- Repository: https://github.com/Rothamsted-Models/RothC_Py
- Commit: `bd90ce3cf616d5316042b73a3b1f09c5b6e3b361` (2025-03-12)
- Licence: Apache License 2.0 (see `LICENSE` in this folder)

| File | Content |
| --- | --- |
| `RothC_input.dat` | Example input: clay 13 %, depth 25 cm, IOM 3.0041 t C/ha, 840 monthly rows (12 for the spin-up, then 1939–2007) |
| `year_results.csv` | Official output: the equilibrium state, then pools every December |
| `month_results.csv` | Official output: pools after every month from January 1939 |

`scripts/rothc.test.ts` runs `lib/engine/rothc.ts` on `RothC_input.dat` and checks that every monthly pool matches
`month_results.csv`. Radiocarbon columns (`modern`, `deltaC`) are not used, because the app does not model radiocarbon.
