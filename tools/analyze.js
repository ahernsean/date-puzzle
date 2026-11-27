// Counts every solution for every (month, date, weekday) combination, in parallel.
// Usage: node tools/analyze.js   -> writes solution-counts.json and prints a summary.
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const P = require('../solver.js');
const DIM = [31,29,31,30,31,30,31,31,30,31,30,31];
const key = (m, d, w) => `${P.MONTHS[m]} ${d} ${P.DAYS[w]}`;

if (!isMainThread) {
  const out = {};
  for (const [m, d, w] of workerData) out[key(m, d, w)] = P.solve(P.cellsFor(m, d, w), { limit: Infinity }).count;
  parentPort.postMessage(out);
} else {
  const jobs = [];
  for (let m = 0; m < 12; m++) for (let d = 1; d <= DIM[m]; d++) for (let w = 0; w < 7; w++) jobs.push([m, d, w]);
  const n = os.cpus().length, chunks = Array.from({ length: n }, () => []);
  jobs.forEach((j, i) => chunks[i % n].push(j));
  const t = Date.now();
  Promise.all(chunks.map(c => new Promise((res, rej) => {
    const wk = new Worker(__filename, { workerData: c }); wk.on('message', res); wk.on('error', rej);
  }))).then(parts => {
    const counts = {};
    for (const [m, d, w] of jobs) for (const part of parts) if (key(m, d, w) in part) counts[key(m, d, w)] = part[key(m, d, w)];
    const entries = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    console.log('combos', entries.length, 'unsolvable', entries.filter(e => !e[1]).length, 'secs', (Date.now() - t) / 1000);
    console.log('fewest', entries.slice(0, 5), 'most', entries.slice(-3));
    const y = [];
    for (const dt = new Date(Date.UTC(2022, 0, 1)); dt.getUTCFullYear() === 2022; dt.setUTCDate(dt.getUTCDate() + 1)) {
      const k = key(dt.getUTCMonth(), dt.getUTCDate(), dt.getUTCDay()); y.push([k, counts[k]]);
    }
    y.sort((a, b) => a[1] - b[1]);
    console.log('2022 days:', y.length, 'unsolvable', y.filter(e => !e[1]).length, 'hardest', y.slice(0, 5), 'easiest', y.slice(-3));
    require('fs').writeFileSync(require('path').join(__dirname, '..', 'solution-counts.json'), JSON.stringify(counts));
  });
}
