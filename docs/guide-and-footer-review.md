# Visual guide and landing footer

Updated from `origin/main` at `cc4425e` before implementation. The existing simulator, comparison chapters, planner and model calculations are preserved.

## Guide

- `/learn#start`: five selectable steps covering setup, field information, simulation, comparison and planning. Each has three concrete actions, a bilingual screenshot, an expected outcome and an optional reminder. Reading progress lasts for the current visit; it does not claim that farm setup or field work has been completed.
- Guide screenshots enlarge in a keyboard-accessible dialog. Zoom reaches 300%; the enlarged image scrolls within the dialog. A 94svh maximum keeps the close and zoom controls available on small phones.
- `/learn#glossary`: eight common terms first, accent-insensitive bilingual search, topic filters, an all-terms option and short definitions with expandable detail. The canonical glossary remains available.
- `/learn#satellite`: NASA/ISS imagery and an illustrative field photo, followed by five selectable source explanations. The page distinguishes regional data, model estimates and field measurements; SMAP L4 and SoilGrids are not presented as plot-level samples.
- `/learn#crops`: four selectable crop roles with examples from the existing crop catalogue and an enlargeable rotation diagram.
- `/learn#experts`: selectable topics generate a question list that can be copied or read in a text field. It does not send a message or claim an adviser has approved a plan.
- Desktop uses large topic tabs and a step sidebar. Mobile uses native topic and step selectors. The demo shortcut preserves an existing farm; it creates the public demo only when no farm exists.

Guide assets and their original sources are recorded in `public/images/CREDITS.md`. Screenshots show only the public Thới Lai demo profile. Their numbers and dates are static examples and may differ from subsequent live runs.

## Landing footer

The existing closing headline is retained and rendered in white. Three shortcuts lead to setup, simulation and planning. Help/data navigation, image credits, the independent-NASA notice, lookup privacy wording and a back-to-top link are included. Mobile shortens the shortcut cards while retaining the same destinations.

## Browser checks

Checked Vietnamese and English; all five guide steps and reading completion; image enlargement to 300%; accent-insensitive and empty-result searches; glossary expansion; source and crop switching; question selection and successful copying; the mobile topic selector; footer headline colour (`rgb(255, 255, 255)`) and back-to-top navigation.

All five guide topics and the footer fit a 390px viewport without horizontal page overflow. The image dialog also fits a 320×640 viewport. TypeScript and ESLint checks pass. The production build passed with one worker thread on this Windows environment. The default multi-process prerender hit EPERM while creating `.next/server/app/_not-found.segments/_not-found`; a clean cache and pre-creating the directory did not reliably fix it. For build verification only, `experimental.cpus: 1` and `experimental.workerThreads: true` were used temporarily. The original `next.config.ts` was restored byte-for-byte afterward and has no Git diff. No worker override is included in the change.
