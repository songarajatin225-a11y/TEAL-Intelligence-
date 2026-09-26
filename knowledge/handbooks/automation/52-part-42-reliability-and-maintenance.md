---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 52
part_title: "Part 42 — Reliability and maintenance"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 42 — Reliability and maintenance

Availability is MTBF divided by MTBF plus MTTR, and a builder controls both at the design stage: reliability through margins, derating and robust feeding; maintainability through modular replacement, diagnostics and spares. Match each maintenance task to how the part fails — replace wear-out parts on schedule, monitor parts that give warning, and design for fast repair of the rest.

### 42.1 Objective

Achieve the availability target with a maintenance programme (preventive, predictive, corrective), a spares strategy and a schedule the customer can execute.

### 42.2 Engineering concept

| Strategy | Trigger | Suits | Example |
|---|---|---|---|
| Preventive (PM) | Time, cycles or hours | Wear-out failures with predictable life | Belt and filter replacement, lubrication |
| Predictive (PdM, condition-based) | Measured condition crosses a threshold | Failures that give warning (P-F interval) | Filter Δp, laser power trend, bearing vibration, drive torque trend |
| Corrective | Failure | Random failures with low consequence | Sensor replacement |
| Design-out | Recurring failure analysis | Chronic problems | Redesigned jam point, stronger bracket |

Failure behaviour follows the "bathtub": early-life failures (Weibull β < 1), random failures (β ≈ 1) and wear-out (β > 1). Scheduled replacement only helps for β > 1; for random failures it wastes parts.

### 42.3 Architecture — spares criticality matrix

|  | Short lead time | Long lead time |
|---|---|---|
| High consequence (stops machine) | Stock at customer or local distributor | Stock at customer; service-exchange agreement |
| Low consequence | Order on demand | Stock a small quantity or design a workaround |

### 42.4 Components — generic PM tasks by component

| Component | Failure mode | Task | Typical interval (confirm with vendor) |
|---|---|---|---|
| Linear guides and ball screws | Wear, lubricant loss | Lubricate; check noise and friction trend | By travel distance or monthly |
| Timing belts | Stretch, tooth wear | Tension check; replace | Quarterly check; replace by life |
| Pneumatic components | Leaks, seal wear | Leak check; drain filters; replace seals | Weekly drain; quarterly leak check |
| Vacuum cups and gripper pads | Wear, cracking | Inspect; replace | Weekly inspect; replace by count |
| Laser protective window | Contamination | Inspect; clean or replace | Daily inspect; replace as needed |
| Laser source and optics | Power loss, contamination | Power measurement; optics inspection | Weekly power; quarterly optics |
| Chiller | Low flow, fouling, coolant degradation | Clean filters; check coolant; replace coolant | Monthly filters; yearly coolant |
| Fume extractor | Filter loading | Monitor Δp; replace filters | Condition-based |
| Panel | Dust, fan failure, heat | Clean filters; check fans and temperatures | Monthly |
| Safety devices | Degradation, tampering | Functional test of each safety function | Per SRS (for example monthly or quarterly) |
| Encoder and UPS batteries | Discharge | Replace | Per vendor (often 2–5 years) |
| Cameras and lighting | Lens contamination, lamp ageing | Clean; golden-sample check | Daily check; clean weekly |

### 42.5 Design methodology

- From the DFMEA (Part 44) and module list, identify each item's dominant failure mode and pattern.
- Choose strategy per item: PM for wear-out, PdM where a measurable warning exists, corrective otherwise.
- Design sensors for PdM signals into the machine (Δp, power, torque, temperature, counts).
- Design for MTTR: modules replaceable in minutes, connectors not hard wiring, diagnostics on HMI.
- Build the PM schedule by frequency with duration and skill level.
- Define spares by criticality and lead time (42.3, Part 41).
- Review field data quarterly and adjust intervals.

### 42.6 Calculations

A=(MTBF)/(MTBF+MTTR)

R(t)=e^(−(t/η)^β)

t_R=η (−lnR)^(1/β)

t_(inspect)≤(P-F)/(2)

η = characteristic life; β = shape parameter; t_R = age at which reliability falls to R; P-F = interval between a detectable potential failure and functional failure.

Examples: a bearing population with β = 2 and η = 20,000 h has R(8,000 h) = e⁻⁰·¹⁶ = 85%; replacing at 90% reliability means t = 20,000 × (0.105)^0.5 = 6,500 h. A fume filter whose Δp warning appears about two weeks before extraction becomes inadequate needs checking at least weekly. With MTBF 172 min (Part 4), cutting MTTR from 15 to 10 min raises availability from 92.0% to 94.5%.

### 42.7 Industrial example — maintenance schedule for the laser marking cell

| Frequency | Task | Duration | Skill |
|---|---|---|---|
| Every shift | Inspect protective window; golden-sample code check; clear debris from nests | 5 min | Operator |
| Daily | Check air pressure and drain filter bowl; check fume Δp reading; clean camera window | 10 min | Operator |
| Weekly | Measure laser power at work plane; focus ramp check; inspect clamp pads and nest pins; replace protective window if needed | 30 min | Technician |
| Monthly | Lubricate shuttle guides and screw; check belt and cable chain; panel filter clean; safety-function tests per SRS; back up software if changed | 90 min | Technician |
| Quarterly | Leak test pneumatics; nest offset check; inspect optics path; check chiller or fan performance | 2 h | Technician |
| Yearly | Shuttle repeatability check; galvo field verification; replace encoder battery if due; review alarm and MTBF data with the builder | 4 h | Technician with builder support |

### 42.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| PM vs PdM | Simple scheduling | Fewer unnecessary replacements, warning time | PdM where signals are cheap to measure (Δp, power, torque) |
| Higher MTBF vs lower MTTR | Fewer stops | Faster recovery | Both; lower MTTR is often cheaper to design in |
| Customer maintenance vs builder service contract | Customer control | Expertise, parts access | Service contract for laser and motion calibration; customer for routine PM |

### 42.9 Common mistakes

- Scheduled replacement of parts that fail randomly.
- No PdM signals designed in, so condition must be guessed.
- Maintenance schedule written for the builder's technicians, not the customer's.
- Safety-function tests missing from the PM plan.
- Intervals never reviewed against field data.

### 42.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Failures right after PM | Maintenance-induced errors | Compare failures vs PM dates | Procedure with checks, training | Post-PM verification step |
| Same part fails repeatedly | Design weakness, misapplication | Failure analysis of returned parts | Design-out | Chronic-failure review monthly |
| PM not done | Too long, unclear, wrong skill level | PM compliance tracking | Simplify, schedule in production plan | PM designed with the customer |

### 42.11 Design checklist

- Failure pattern and strategy defined per maintainable item
- PdM signals designed into the machine
- MTTR targets per module; quick-change designs
- PM schedule with durations and skill levels
- Safety-function tests included
- Spares by criticality and lead time
- Field-data review process agreed

### 42.12 Key takeaways

- Match the maintenance strategy to the failure pattern.
- Design PdM signals and fast repair into the machine.
- MTTR reduction is often the cheapest availability gain.
- Review intervals against real data.
