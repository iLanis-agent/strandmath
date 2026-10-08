/* strandmath engine - holiday light truth-teller.
   Pure functions, shared by browser and node test runner.
   Published/rule-of-thumb anchors, all labeled in the UI:
   - Typical strand specs (watts, lit length, connect limits) are common retail/manufacturer figures, labeled.
   - 216 W per connected run: common UL/manufacturer guidance for 22 AWG light strings, labeled.
   - Continuous loads at 80% of breaker rating (NEC continuous-load guidance, published):
     15 A x 120 V x 0.8 = 1440 W, 20 A = 1920 W.
   - $0.17/kWh typical US residential rate, editable in the app. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Strand = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const RUN_WATT_LIMIT = 216;  // common guidance for 22 AWG strings
  const CONTINUOUS_FACTOR = 0.8; // NEC continuous-load guidance
  const VOLT = 120;

  const TYPES = {
    mini_led:    { label: 'Mini LED (100 ct)',       bulbs: 100, lenFt: 25, watts: 5,  maxStrands: 45, led: true },
    mini_inc:    { label: 'Mini incandescent (100 ct)', bulbs: 100, lenFt: 25, watts: 40, maxStrands: 5, led: false },
    c9_led:      { label: 'C9 LED (25 ct)',          bulbs: 25,  lenFt: 25, watts: 8,  maxStrands: 25, led: true },
    c9_inc:      { label: 'C9 incandescent (25 ct)', bulbs: 25,  lenFt: 25, watts: 175, maxStrands: 2, led: false },
    icicle_led:  { label: 'Icicle LED (150 ct)',     bulbs: 150, lenFt: 8,  watts: 6,  maxStrands: 20, led: true },
    icicle_inc:  { label: 'Icicle incandescent (150 ct)', bulbs: 150, lenFt: 8, watts: 72, maxStrands: 3, led: false }
  };

  function strandsNeeded(totalFt, typeKey) {
    const t = TYPES[typeKey];
    return Math.ceil(totalFt / t.lenFt);
  }

  function perRun(typeKey) {
    const t = TYPES[typeKey];
    return Math.max(1, Math.min(t.maxStrands, Math.floor(RUN_WATT_LIMIT / t.watts)));
  }

  function plan(totalFt, typeKey) {
    const t = TYPES[typeKey];
    const strands = strandsNeeded(totalFt, typeKey);
    const watts = strands * t.watts;
    const pr = perRun(typeKey);
    const runs = Math.ceil(strands / pr);
    return { type: t, totalFt, strands, watts, perRun: pr, runs,
             bulbs: strands * t.bulbs,
             limiting: Math.floor(RUN_WATT_LIMIT / t.watts) <= t.maxStrands ? 'wattage' : 'strand count' };
  }

  function circuitLimit(amps) { return amps * VOLT * CONTINUOUS_FACTOR; }

  function circuitVerdict(totalWatts, otherWatts, amps) {
    const limit = circuitLimit(amps || 15);
    const used = totalWatts + (otherWatts || 0);
    const headroom = limit - used;
    let band;
    if (used <= limit * 0.7) band = 'ok';
    else if (used <= limit) band = 'warn';
    else band = 'bad';
    return { limit, used, headroom, band };
  }

  function seasonCost(watts, hoursPerDay, days, ratePerKwh) {
    const kwh = watts / 1000 * hoursPerDay * days;
    return { kwh, usd: kwh * (ratePerKwh == null ? 0.17 : ratePerKwh) };
  }

  const fmt = (x, dp) => x.toFixed(dp == null ? 1 : dp);
  return { RUN_WATT_LIMIT, CONTINUOUS_FACTOR, VOLT, TYPES, strandsNeeded, perRun, plan, circuitLimit, circuitVerdict, seasonCost, fmt };
});
