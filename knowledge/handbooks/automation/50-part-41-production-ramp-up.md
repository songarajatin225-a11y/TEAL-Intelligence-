---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 50
part_title: "Part 41 — Production ramp-up"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 41 — Production ramp-up

A machine is finished when the customer's own team runs it at rate, at yield and at capability, week after week. Plan the ramp as a project: pilot lots, run-at-rate, an OEE loss tree reviewed weekly, trained operators and technicians, spares on site, and a hypercare period with the builder's engineer resident until the Gate 10 criteria are met.

### 41.1 Objective

Take the accepted machine from first production to sustained target UPH, yield, OEE and Cpk, and hand it over to production ownership (Gate 10).

### 41.2 Engineering concept

| Phase | Purpose | Typical duration |
|---|---|---|
| Pilot production | First production lots under close watch; confirm recipes on real flow | 1–2 weeks |
| Run-at-rate | Demonstrate rate and quality over a defined period with production staff | 1–3 days (often part of SAT) |
| Ramp | Close OEE losses; stabilize yield and capability | 4–12 weeks |
| Hypercare | Builder engineer on site or on call with fast response | 2–8 weeks |
| Production release | Ownership transferred; warranty and service mode | Gate 10 |

### 41.3 Architecture — OEE loss tree

| OEE factor | Loss categories | Typical causes in early life | Owner |
|---|---|---|---|
| Availability | Breakdowns, setups and changeovers, waiting for material | Early-life failures, untrained changeovers, starved machine | Maintenance, production |
| Performance | Micro-stops, reduced speed | Jams, sensor chattering, conservative recipes | Builder, process engineering |
| Quality | Scrap, rework, start-up losses | Recipe tuning, material variation | Quality, process engineering |

### 41.4 Components — training and spares

| Role | Training content | Competence check |
|---|---|---|
| Operator | Start/stop, loading, changeover, alarms and first-level responses, quality checks | Observed run of a shift; alarm response quiz |
| Technician | Manual mode, sensor and actuator replacement, calibration checks, PM tasks, basic PLC diagnostics | Supervised fault-finding on injected faults |
| Process engineer | Recipes, process window, capability monitoring, data analysis | Recipe change with validation record |
| Maintenance planner | PM schedule, spares, consumables | PM plan loaded into the plant system |

| Spares class | Examples | Stocking rule |
|---|---|---|
| Consumables | Protective windows, filters, suction cups, gripper pads | Weekly usage × reorder lead time × 1.5 |
| Wear parts | Belts, locating pins, nest inserts, seals | By expected life and lead time |
| Critical spares | Servo motor and drive, sensors, safety devices, valve terminal, camera | Poisson-based (41.6); on site for long lead times |
| Service-exchange items | Laser source, galvo head, robot | Supplier exchange agreement; not stocked by customer |

### 41.5 Design methodology

- Agree ramp targets and Gate 10 criteria in the contract: UPH, yield, OEE, Cpk, duration.
- Log every stop with a reason code from day one (Part 49).
- Review the loss tree weekly; attack the top three losses with owners.
- Train and certify staff by role; rotate so every shift has certified people.
- Stock initial spares and consumables before SAT.
- Run hypercare with defined response times; transfer knowledge daily.
- Close the open-item list; confirm capability on production lots.
- Hold the Gate 10 review and sign production release.

### 41.6 Calculations

OEE(t)=OEE_(target)−(OEE_(target)−OEE_0) e^(−t/τ)

λ_(LT)=N⋅(t_(LT))/(MTBF)

P(X≤s)=∑_(k=0)^s (λ_(LT)^ke^(−λ_(LT)))/(k!)

OEE(t) = simple ramp model with time constant τ; λ_LT = expected failures of N identical parts during the replenishment lead time t_LT; s = spares stocked.

Examples: starting at OEE₀ = 65% with target 86% and τ = 3 weeks, week 6 reaches 86 − 21 × e⁻² = 83.2%, and 85% is reached after 3 × ln 21 = 9.1 weeks — so a Gate 10 at week 4 is unrealistic unless τ is shortened by hypercare. For four identical servo motors with MTBF 50,000 h and a 6-week (1,008 h) lead time running 24/7: λ = 4 × 1,008 / 50,000 = 0.081; P(no failure) = 92.2%; stocking one spare gives P(X ≤ 1) = 99.7%.

### 41.7 Industrial example — ramp plan for the marking cell

| Week | Focus | Target | Result tracked |
|---|---|---|---|
| 1 | Pilot lots, both variants | Yield ≥ 97%, all codes ≥ grade B | Yield, grade distribution |
| 2 | Run-at-rate within SAT | Good output per contract | OEE, stop reasons |
| 3–6 | Loss reduction: top stops were loader jams and clamp timeouts | OEE ≥ 83% | Weekly loss Pareto |
| 7–10 | Stabilization, capability on production lots | OEE ≥ 86%, Cpk ≥ 1.33 on position | Cpk, MTBF, MTTR |
| 10 | Gate 10 review | All criteria met for 2 consecutive weeks | Release signed |

### 41.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Early release vs extended hypercare | Lower builder cost | Faster ramp, protected reputation | Hypercare until two consecutive weeks at target |
| Customer-held spares vs builder consignment | Customer control | Builder carries inventory cost, faster platform service | Consignment for platform customers with several machines |
| Aggressive vs conservative recipes during ramp | Higher UPH early | Stable yield | Conservative first; speed up once capability is proven |

### 41.9 Common mistakes

- No stop-reason logging, so ramp meetings argue from memory.
- Training only the day shift.
- Spares ordered after the first breakdown.
- Declaring release on one good week.
- Builder leaves before the customer's technicians can recover from common faults.

### 41.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| OEE plateaus below target | One dominant loss not addressed | Loss Pareto by category and module | Focused improvement on top loss | Weekly loss review with owners |
| Night shift performs worse | Training gaps, support availability | OEE by shift | Train and certify, remote support | Role-based training for all shifts |
| Yield drifts after release | Process drift, maintenance gaps | SPC charts, PM compliance | Restore PM, recalibrate | SPC and PM in the control plan |

### 41.11 Design checklist

- Ramp targets and Gate 10 criteria agreed in contract
- Stop-reason logging live from first production
- Weekly OEE loss review with owners
- Training by role with competence checks for all shifts
- Consumables, wear parts and critical spares on site
- Hypercare plan with response times
- Capability confirmed on production lots
- Gate 10 review signed

### 41.12 Key takeaways

- Plan the ramp; it takes weeks, not days.
- Manage by the loss tree with stop-reason data.
- Train every shift and stock spares before they are needed.
- Release on sustained results, not on a good week.
BOOK VIII
