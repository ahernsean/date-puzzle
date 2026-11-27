# Calendar Puzzle

An interactive version of the wooden "puzzle a day" calendar with weekdays. Pick a date, then cover
every square except that date's **month**, **day number**, and **day of the week**.

**Play it:** https://ahernsean.github.io/date-puzzle/

## How to play

- Pick a day with the date box or the ◀ ▶ buttons. The three squares to leave uncovered are highlighted.
- Drag pieces onto the board. They snap into place when they fit (no overlaps, no covering the highlighted squares).
- Tap a piece to select it, then **Rotate** or **Flip**. Shortcuts: double-tap or right-click rotates,
  `R` rotates, `F` flips, and both work while dragging.
- **Solve** computes a solution and animates the pieces into place. **Clear** puts every piece back.

## The board and pieces

The board has 50 squares: 12 months (2 rows of 6), dates 1 to 31, and 7 weekdays
(Sun to Wed after 31, then Thur, Fri, Sat on the bottom row). Each day leaves 3 squares open, so the
pieces cover 47 squares: seven pentominoes (U, Z, N, P, V, T, and the long L) and three tetrominoes
(I, S, and L). The shapes were read from a photo of the physical puzzle.

## Files

- `index.html`: the app (no build step, no dependencies).
- `solver.js`: board model, piece shapes, and a backtracking exact-cover solver (browser and Node).
- `tools/analyze.js`: counts every solution for every month/date/weekday combination and writes
  `solution-counts.json`, which the app uses to show how many solutions a day has.
