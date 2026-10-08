#!/usr/bin/env node
/* Compares engine.js against the independent Python oracle (expected.json),
   plus property and anchor checks. */
const S = require('../engine.js');
const exp = require('./expected.json');
let pass = 0, fail = 0;
const T = (name, cond) => { if (cond) pass++; else { fail++; console.error('FAIL', name); } };
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(b));

for (const c of exp.cases) {
  if (c.kind === 'plan') {
    const p = S.plan(c.ft, c.type);
    T(`plan strands ${c.ft} ${c.type}`, p.strands === c.expected.strands);
    T('plan watts', p.watts === c.expected.watts);
    T('plan perRun', p.perRun === c.expected.perRun);
    T('plan runs', p.runs === c.expected.runs);
    T('plan bulbs', p.bulbs === c.expected.bulbs);
    T('plan limiting', p.limiting === c.expected.limiting);
  } else if (c.kind === 'circuit') {
    const v = S.circuitVerdict(c.w, c.other, c.amps);
    T(`circuit ${c.w}/${c.other}/${c.amps}`, near(v.limit, c.expected.limit, 1e-12) && near(v.used, c.expected.used, 1e-12)
      && near(v.headroom, c.expected.headroom, 1e-12) && v.band === c.expected.band);
  } else if (c.kind === 'season') {
    const s = S.seasonCost(c.w, c.hrs, c.days, c.rate);
    T(`season ${c.w}`, near(s.kwh, c.expected.kwh, 1e-12) && near(s.usd, c.expected.usd, 1e-12));
  }
}

// --- anchors ---
T('anchor: 15A continuous = 1440 W', S.circuitLimit(15) === 1440);
T('anchor: 20A continuous = 1920 W', S.circuitLimit(20) === 1920);
T('anchor: 300 ft mini inc = 12 strands 480 W 3 runs', (() => { const p = S.plan(300, 'mini_inc'); return p.strands === 12 && p.watts === 480 && p.runs === 3; })());
T('anchor: 300 ft mini LED = 12 strands 60 W 1 run', (() => { const p = S.plan(300, 'mini_led'); return p.strands === 12 && p.watts === 60 && p.runs === 1; })());
T('anchor: C9 inc capped at 1/run by the 216W rule (stricter than the 2-strand box limit)', S.perRun('c9_inc') === 1);
T('anchor: C9 inc watt rule alone gives 1', Math.floor(S.RUN_WATT_LIMIT / S.TYPES.c9_inc.watts) === 1);
T('anchor: 480 W season = 129.6 kWh $22.03', (() => { const s = S.seasonCost(480, 6, 45, 0.17); return near(s.kwh, 129.6, 1e-12) && near(s.usd, 22.032, 1e-12); })());

// --- properties ---
const rng = (() => { let s = 5; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
const keys = Object.keys(S.TYPES);
for (let i = 0; i < 80; i++) {
  const ft = 1 + rng() * 1500, key = keys[Math.floor(rng() * keys.length)];
  const p = S.plan(ft, key);
  T('prop: strands cover footage', p.strands * p.type.lenFt >= ft);
  T('prop: minimal strands', (p.strands - 1) * p.type.lenFt < ft);
  T('prop: watts = strands x watts', p.watts === p.strands * p.type.watts);
  T('prop: runs cover strands', p.runs * p.perRun >= p.strands && (p.runs - 1) * p.perRun < p.strands);
  T('prop: perRun respects both limits', p.perRun <= p.type.maxStrands && p.perRun * p.type.watts <= S.RUN_WATT_LIMIT + p.type.watts);
  const ledKey = key.includes('led') ? key : key.replace('_inc', '_led');
  const incKey = key.includes('inc') ? key : key.replace('_led', '_inc');
  T('prop: LED never more watts than incand', S.plan(ft, ledKey).watts <= S.plan(ft, incKey).watts);
  T('prop: LED never more runs than incand', S.plan(ft, ledKey).runs <= S.plan(ft, incKey).runs);
}
for (let i = 0; i < 40; i++) {
  const w = rng() * 2500, amps = rng() < 0.5 ? 15 : 20;
  const v = S.circuitVerdict(w, 0, amps);
  const lim = S.circuitLimit(amps);
  T('prop: band coherence', (w <= lim * 0.7 && v.band === 'ok') || (w > lim * 0.7 && w <= lim && v.band === 'warn') || (w > lim && v.band === 'bad'));
  T('prop: cost linear', near(S.seasonCost(2 * w, 5, 10, 0.2).usd, 2 * S.seasonCost(w, 5, 10, 0.2).usd, 1e-9));
}
T('prop: zero footage = zero strands', S.plan(0, 'mini_led').strands === 0);

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
