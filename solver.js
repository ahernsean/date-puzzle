// Calendar puzzle model + solver. Works in the browser (window.Puzzle) and Node (module.exports).
(function (root) {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS = ['Sun','Mon','Tues','Wed','Thur','Fri','Sat'];

  // Board: 8 rows x 7 cols. null = not part of the board.
  const ROWS = 8, COLS = 7;
  const LABELS = [];
  for (let r = 0; r < ROWS; r++) LABELS.push(new Array(COLS).fill(null));
  MONTHS.forEach((m, i) => { LABELS[Math.floor(i / 6)][i % 6] = m; });
  for (let d = 1; d <= 31; d++) { const k = d - 1; LABELS[2 + Math.floor(k / 7)][k % 7] = String(d); }
  // Row 6 after 29,30,31: Sun Mon Tues Wed ; row 7 cols 4-6: Thur Fri Sat
  ['Sun','Mon','Tues','Wed'].forEach((d, i) => { LABELS[6][3 + i] = d; });
  ['Thur','Fri','Sat'].forEach((d, i) => { LABELS[7][4 + i] = d; });

  const CELLS = []; // index -> [r,c]
  const INDEX = {}; // "r,c" -> index
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (LABELS[r][c] !== null) {
    INDEX[r + ',' + c] = CELLS.length; CELLS.push([r, c]);
  }

  // Pieces as read from the photo (row, col offsets).
  const PIECES = [
    { id: 'U', cells: [[0,0],[0,2],[1,0],[1,1],[1,2]] },
    { id: 'S', cells: [[0,0],[1,0],[1,1],[2,1]] },
    { id: 'Z', cells: [[0,0],[0,1],[1,1],[2,1],[2,2]] },
    { id: 'N', cells: [[0,0],[0,1],[0,2],[1,2],[1,3]] },
    { id: 'P', cells: [[0,0],[0,1],[1,0],[1,1],[2,1]] },
    { id: 'V', cells: [[0,0],[1,0],[2,0],[2,1],[2,2]] },
    { id: 'T', cells: [[0,2],[1,0],[1,1],[1,2],[2,2]] },
    { id: 'I', cells: [[0,0],[1,0],[2,0],[3,0]] },
    { id: 'L4', cells: [[0,0],[1,0],[1,1],[1,2]] },
    { id: 'L5', cells: [[0,0],[1,0],[1,1],[1,2],[1,3]] },
  ];

  function normalize(cells) {
    const minR = Math.min(...cells.map(c => c[0])), minC = Math.min(...cells.map(c => c[1]));
    return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }
  const rot = cells => cells.map(([r, c]) => [c, -r]);   // 90° clockwise
  const flip = cells => cells.map(([r, c]) => [r, -c]);  // mirror left-right

  // All distinct orientations: index k = flip? (k>=4) then rotate (k%4) times.
  function orientations(cells) {
    const out = [], seen = new Set();
    for (let f = 0; f < 2; f++) {
      let cur = f ? flip(cells) : cells.slice();
      for (let r = 0; r < 4; r++) {
        const n = normalize(cur), key = JSON.stringify(n);
        if (!seen.has(key)) { seen.add(key); out.push({ cells: n, flip: f, rot: r }); }
        cur = rot(cur);
      }
    }
    return out;
  }

  function cellsFor(month, date, dow) {
    return [MONTHS[month], String(date), DAYS[dow]].map(lbl => {
      for (const [k, i] of Object.entries(INDEX)) { const [r, c] = k.split(',').map(Number); if (LABELS[r][c] === lbl) return i; }
    });
  }

  // Precompute placements: for each cell, the placements whose first (reading-order) cell is that cell.
  const N = CELLS.length; // 50
  const placementsByCell = Array.from({ length: N }, () => []);
  PIECES.forEach((p, pi) => {
    orientations(p.cells).forEach(o => {
      for (let r = -4; r < ROWS; r++) for (let c = -4; c < COLS; c++) {
        const idx = [];
        let ok = true;
        for (const [dr, dc] of o.cells) {
          const i = INDEX[(r + dr) + ',' + (c + dc)];
          if (i === undefined) { ok = false; break; }
          idx.push(i);
        }
        if (!ok) continue;
        const first = Math.min(...idx);
        placementsByCell[first].push({ piece: pi, cells: idx, row: r, col: c, orient: o });
      }
    });
  });

  // Backtracking exact cover. Returns array of placements, or null. If countAll, returns count.
  function solve(holes, opts = {}) {
    const filled = new Uint8Array(N);
    holes.forEach(h => filled[h] = 1);
    const used = new Uint8Array(PIECES.length);
    const stack = [];
    let count = 0, result = null;
    const limit = opts.limit || 1;
    function rec() {
      let first = -1;
      for (let i = 0; i < N; i++) if (!filled[i]) { first = i; break; }
      if (first === -1) { count++; if (!result) result = stack.slice(); return count >= limit; }
      for (const pl of placementsByCell[first]) {
        if (used[pl.piece]) continue;
        let ok = true;
        for (const i of pl.cells) if (filled[i]) { ok = false; break; }
        if (!ok) continue;
        used[pl.piece] = 1; for (const i of pl.cells) filled[i] = 1; stack.push(pl);
        if (rec()) return true;
        stack.pop(); for (const i of pl.cells) filled[i] = 0; used[pl.piece] = 0;
      }
      return false;
    }
    rec();
    return { solution: result, count };
  }

  const api = { MONTHS, DAYS, ROWS, COLS, LABELS, CELLS, INDEX, PIECES, orientations, normalize, cellsFor, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Puzzle = api;
})(this);
