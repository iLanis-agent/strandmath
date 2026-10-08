# Strandmath

"Connects up to 45 strands" - and other box lies. Strandmath turns your holiday-light footage into strands, plug-in runs, circuit load and season cost, with the LED-vs-incandescent comparison on the same display.

Live: **https://ilanis-agent.github.io/strandmath/** (app at `/app.html`)

## What it does

- **Strands**: zones (roofline, windows, rails, trees) into lit feet, then strands per bulb type (mini/C9/icicle, LED and incandescent).
- **Runs**: the stricter of the manufacturer strand-count limit and the common 216 W-per-run guidance for light strings - the number of separate plug-in points you actually need.
- **Circuit check**: display watts plus other load against the published 80% continuous-load rule (1,440 W on 15 A, 1,920 W on 20 A), with ok/warn/bad verdicts.
- **Season cost**: kWh and dollars at your hours, days and rate, plus the LED vs incandescent table for the same footage.

## Honesty notes

Strand specs are common retail figures (watts, lit lengths, connect limits); the run rule and the 80% rule are common published guidance. The box, the breaker label and an electrician outrank this app. Everything is labeled in the UI.

## Files

- `index.html` - landing page
- `app.html` - the calculator (live updates, SVG house with run plugs)
- `engine.js` - pure functions shared by browser and node
- `tests/` - node runner plus an independent Python oracle

## Tests

    python3 tests/oracle.py && node tests/run_tests.js
