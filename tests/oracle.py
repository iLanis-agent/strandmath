#!/usr/bin/env python3
"""Independent oracle for strandmath. Recomputes every case from first
principles (no shared code with engine.js) and writes expected.json."""
import json, math

RUN_LIMIT = 216
TYPES = {
    'mini_led':    dict(bulbs=100, lenFt=25, watts=5,  maxStrands=45),
    'mini_inc':    dict(bulbs=100, lenFt=25, watts=40, maxStrands=5),
    'c9_led':      dict(bulbs=25,  lenFt=25, watts=8,  maxStrands=25),
    'c9_inc':      dict(bulbs=25,  lenFt=25, watts=175, maxStrands=2),
    'icicle_led':  dict(bulbs=150, lenFt=8,  watts=6,  maxStrands=20),
    'icicle_inc':  dict(bulbs=150, lenFt=8,  watts=72, maxStrands=3),
}

def plan(total_ft, key):
    t = TYPES[key]
    strands = math.ceil(total_ft / t['lenFt'])
    watts = strands * t['watts']
    per_run = max(1, min(t['maxStrands'], RUN_LIMIT // t['watts']))
    return {'strands': strands, 'watts': watts, 'perRun': per_run,
            'runs': math.ceil(strands / per_run), 'bulbs': strands * t['bulbs'],
            'limiting': 'wattage' if RUN_LIMIT // t['watts'] <= t['maxStrands'] else 'strand count'}

def circuit(total_w, other, amps):
    limit = amps * 120 * 0.8
    used = total_w + other
    band = 'ok' if used <= limit * 0.7 else ('warn' if used <= limit else 'bad')
    return {'limit': limit, 'used': used, 'headroom': limit - used, 'band': band}

def season(watts, hrs, days, rate):
    kwh = watts / 1000.0 * hrs * days
    return {'kwh': kwh, 'usd': kwh * rate}

cases = []
for ft in [25, 60, 100, 125, 200, 300, 450, 1000]:
    for key in TYPES:
        cases.append({'kind': 'plan', 'ft': ft, 'type': key, 'expected': plan(ft, key)})
for w, other, amps in [(0, 0, 15), (480, 0, 15), (1000, 200, 15), (1440, 0, 15),
                       (1441, 0, 15), (1500, 0, 15), (1900, 0, 20), (2000, 100, 20), (60, 500, 15)]:
    cases.append({'kind': 'circuit', 'w': w, 'other': other, 'amps': amps, 'expected': circuit(w, other, amps)})
for w, hrs, days, rate in [(480, 6, 45, 0.17), (60, 6, 45, 0.17), (175, 4, 30, 0.12),
                            (1000, 8, 60, 0.25), (40, 1, 1, 0.10)]:
    cases.append({'kind': 'season', 'w': w, 'hrs': hrs, 'days': days, 'rate': rate,
                  'expected': season(w, hrs, days, rate)})

with open('expected.json', 'w') as f:
    json.dump({'cases': cases}, f, separators=(',', ':'))
print(f'{len(cases)} cases written')
