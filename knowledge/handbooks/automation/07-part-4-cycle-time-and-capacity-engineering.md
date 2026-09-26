---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 7
part_title: "Part 4 — Cycle time and capacity engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 4 — Cycle time and capacity engineering

Design the machine backward from the customer's good-units-per-day: planned time and OEE set the ideal cycle time, the longest indivisible operation sets the parallelism, and only then are motions sized. For 10,000 units/day the worked example below lands on a 6.8 s ideal cycle and a two-station shuttle with 22% headroom.

### 4.1 Objective

Convert a daily demand into ideal cycle time, required UPH, station count, machine count and a per-motion time budget, and prove the chosen architecture meets demand with margin.

### 4.2 Engineering concept

| Term | Definition | Unit |
|---|---|---|
| Cycle time (CT) | Time between two consecutive good or started parts leaving the machine at steady state | s |
| Takt time | Available time ÷ customer demand; the pace the customer needs | s |
| UPH | Units per hour; ideal UPH = 3,600 / CT_ideal | h⁻¹ |
| Throughput | Actual good units per unit time, after all losses | units/day |
| Bottleneck | Resource with the longest effective time per unit; sets CT | — |
| Sequential processing | Operations one after another on one part at one station | — |
| Parallel processing | Several parts processed simultaneously (stations, nests, machines) | — |
| Buffer | Storage decoupling two resources so a stop in one does not stop the other | units |
| Utilization | Demand ÷ capacity | % |
| OEE | Availability × performance × quality | % |

### 4.3 Architecture — ways to create parallelism

| Pattern | How it cuts CT | CT formula | Best when |
|---|---|---|---|
| Sequential single station | None | Σ t_i | Low volume, long process, simple |
| Load-while-process (shuttle, 2 nests) | Hides load, unload, align behind process | max(t_handling, t_process) + t_shuttle | Process time ≈ handling time |
| Rotary indexing table (n stations) | Each station does one operation | max(t_station) + t_index | Many short operations of similar length |
| Inline transfer (pallet conveyor) | Stations in series with buffers | max(t_station) + t_transfer | Many operations, scalable, buffered |
| Multi-nest / gang processing | Several parts per process step | Σ t_i / k (per part) | Process with long setup, short per-part time |
| Parallel machines | Duplicate the whole machine | CT_machine / m | Redundancy needed, simple scaling |

### 4.4 Components of a cycle

A cycle is a chain of five time types; only the first adds value. Measure each in trials, never estimate the process time from a datasheet.

| Time type | Examples | Typical share of cycle |
|---|---|---|
| Process | Mark, weld, dispense, measure | 30–60% |
| Handling | Load, unload, transfer | 20–40% |
| Positioning and settling | Axis moves, index, settle to tolerance | 10–25% |
| Confirmation | Sensor checks, clamp confirmed, vision acquisition | 5–15% |
| Communication | PLC scan, fieldbus, MES handshake, recipe load | 1–10% |

### 4.5 Design methodology — designing backward from UPH

- Take the year-3 demand in good units per day and the customer's shift pattern.
- Compute planned production time: calendar time minus breaks, planned maintenance and planned changeovers.
- Set the OEE target (availability, performance, quality) agreed with the customer.
- Compute CT_ideal and required ideal UPH.
- Apply a design margin of 10–15% for ramp-up, wear and variant mix.
- List every operation with its measured or estimated time.
- Find the longest indivisible operation; if it exceeds the target CT, split it (more nests, more heads) or duplicate the machine.
- Choose the parallelism pattern (4.3) and compute CT for each candidate.
- Allocate a time budget to every motion and hand it to motion sizing (Part 12).
- Draw the time chart (Gantt of one cycle) and check overlaps and interlocks.
- Simulate stochastic stops and buffers where the line has more than one resource.
- Prove at FAT with a run-at-rate test, and at SAT with a multi-day run.

### 4.6 Calculations

T_(plan)=T_(calendar)−T_(breaks)−T_(PM)−T_(changeover)

OEE=A⋅P⋅Q

A=(T_(run))/(T_(plan))

P=(CT_(ideal)⋅N_(total))/(T_(run))

Q=(N_(good))/(N_(total))

CT_(ideal)=(T_(plan)⋅A⋅P⋅Q)/(N_(good))

UPH_(ideal)=(3600)/(CT_(ideal))

N_(stations,min)=⌈(∑t_i)/(CT_(target))⌉

η_(balance)=(∑t_i)/(N_(stations)⋅CT)

N_(machines)=⌈(UPH_(required))/(UPH_(machine))⌉

U=(N_(demand))/(N_(capacity))

A=(MTBF)/(MTBF+MTTR)

B=(t_(stop,max))/(T_(takt))

WIP=TH⋅LT

T_plan = planned production time (s); A, P, Q = availability, performance, quality rates; T_run = actual run time; N_total, N_good = total and good units; t_i = time of operation i; B = buffer size to ride through an upstream stop of t_stop,max; WIP, TH, LT = work in process, throughput, lead time (Little's law).

### 4.7 Industrial example — 10,000 units per day

A customer needs 10,000 good laser-marked and vision-verified parts per day, three shifts, seven days a week.

Step 1 — planned time. Calendar 1,440 min; breaks 3 × 30 = 90 min (machine stops); planned maintenance 30 min/day; no daily changeover. T_plan = 1,320 min = 79,200 s = 22.0 h.

Step 2 — takt. On good units: 79,200 / 10,000 = 7.92 s.

Step 3 — OEE target. A = 92%, P = 95%, Q = 98.5% → OEE = 0.92 × 0.95 × 0.985 = 86.1%.

Step 4 — ideal cycle and UPH. CT_ideal = 79,200 × 0.861 / 10,000 = 6.82 s → UPH_ideal = 528.

Step 5 — design margin. 10% margin → design target CT ≤ 6.2 s (581 UPH).

Step 6 — operation times (from process trials and handling estimates):

| Operation | Time (s) | Divisible? |
|---|---|---|
| Load part | 1.5 | No |
| Align and read ID | 1.4 | No |
| Laser mark | 3.5 | Only by adding a second galvo head |
| Vision verify | 0.8 | No |
| Unload and sort | 1.2 | No |
| Sum | 8.4 |  |

N_stations,min = ⌈8.4 / 6.2⌉ = 2. The longest indivisible operation (3.5 s) is below 6.2 s, so one laser head can carry the rate if handling is hidden behind marking.

Step 7 — compare architectures. Daily good output = 22 h × UPH_ideal × 0.861.

| Architecture | Bottleneck | CT (s) | Ideal UPH | Good units/day | Utilization at 10,000/day | Relative cost |
|---|---|---|---|---|---|---|
| Single station, sequential | Whole cycle | 8.4 | 429 | 8,126 | 123% — fails | 1.0 |
| Two-station shuttle (load while mark) | Mark + verify 4.3 s, shuttle 1.0 s | 5.3 | 679 | 12,862 | 78% | 1.2 |
| Four-station rotary indexer | Mark 3.5 s, index 0.8 s | 4.3 | 837 | 15,857 | 63% | 1.5 |
| Two single-station machines | Each 8.4 s | 4.2 (combined) | 857 | 16,236 | 62% | 1.8 |

Step 8 — decision, with trade-offs. The shuttle meets demand with 22% headroom at the lowest cost that works. The rotary indexer buys 23% more capacity for about 25% more cost; choose it if year-3 demand may exceed 12,000/day. Two machines cost most but give redundancy — the right answer when a single stoppage would stop the customer's line.

Step 9 — shuttle time chart and motion budget.

| Resource | 0.0–1.0 s | 1.0–4.5 s | 4.5–5.3 s |
|---|---|---|---|
| Shuttle axis | Move 400 mm, settle | Idle | Idle |
| Nest at laser | Arrive, clamp confirm | Laser mark (3.5 s) | Vision verify (0.8 s) |
| Nest at operator side | Arrive | Unload (1.2 s), load (1.5 s), align and ID (1.4 s) — 4.1 s ends at 5.1 s | Wait 0.2 s |

Shuttle budget: 0.8 s move + 0.2 s settle for 400 mm. A triangular profile needs a = 4d / t² = 4 × 0.4 / 0.8² = 2.5 m/s² and v_max = a · t / 2 = 1.0 m/s — modest numbers that go to servo sizing in Part 12.

Step 10 — buffer upstream. To ride through upstream stops of up to 5 min: B = 300 / 7.92 = 38 parts of accumulation conveyor.

Step 11 — availability sanity check. A = 92% with MTTR = 15 min needs MTBF = A × MTTR / (1 − A) = 0.92 × 15 / 0.08 = 172 min. The machine must run nearly three hours between stops; design every jam point accordingly.

### 4.8 Design trade-offs

| Trade-off | Choose the first when | Choose the second when |
|---|---|---|
| Sequential vs parallel | Process time dominates and volume is low | Handling time is comparable to process time |
| Shuttle vs rotary indexer | Two to three operations, moderate rate | Four or more short operations, high rate |
| Rotary vs inline pallet line | Compact footprint, fixed operation count | Scalable, buffered, many operations |
| One big machine vs several small | Floor space and cost dominate | Redundancy, phased capacity, variant separation |
| Large buffer vs small buffer | Upstream is unreliable, parts are cheap | WIP cost, space or cleanliness dominate |

### 4.9 Common mistakes

- Quoting CT from process time alone and discovering handling doubles it.
- Designing to today's demand instead of year-3.
- Using 100% OEE; new equipment rarely exceeds 85–90% in its first year.
- Forgetting communication time: a 300 ms MES handshake per part costs 5% of a 6 s cycle.
- Not counting variant changeovers in planned time.

### 4.10 Troubleshooting — cycle-time shortfall

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| CT 10–20% above design | Conservative motion profiles, long settle, sequential waits | Timestamp every step in PLC; build actual time chart | Per-step timing over 100 cycles | Overlap moves, tune settle windows, parallelize checks | Time chart reviewed at G3 |
| CT fine, UPH low | Micro-stops, starved or blocked | Log starved/blocked/fault states | State durations per hour | Fix feeding, add buffer | OEE loss tree at G2 |
| CT drifts upward | Vision retries, MES latency, wear | Count retries and handshake time | Retry rate, latency histogram | Improve lighting, async MES write | Log retries as a KPI |

### 4.11 Design checklist

- Demand stated for year 1 and year 3, good units/day
- Planned time, OEE components and design margin agreed with the customer
- Operation times measured, not assumed, for the process step
- At least two architectures compared on CT, capacity, utilization and cost
- Time chart drawn for one full cycle, including communication and confirmation
- Motion time budgets issued to motion sizing
- Buffers sized from upstream and downstream stop data
- Run-at-rate test defined for FAT and SAT

### 4.12 Key takeaways

- Start from good units per day, planned time and OEE; CT_ideal follows.
- The longest indivisible operation decides whether you need more heads, nests or machines.
- Compare architectures by capacity, utilization, cost and redundancy — never by CT alone.
- Every motion inherits a time budget from the cycle, and is sized to it.
