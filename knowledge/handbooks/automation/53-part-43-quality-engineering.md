---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 53
part_title: "Part 43 — Quality engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 43 — Quality engineering

Quality in equipment building has two faces: the quality of the machine we build, and the quality of the product the machine makes. Build both into the architecture — gates and inspection plans for the machine; error-proofing, in-machine verification, SPC and interlocks for the product — and prove every measurement system before trusting its numbers.

### 43.1 Objective

Define quality gates, inspection plans, capability and measurement-system requirements, the control plan, and the nonconformance and corrective-action system for both machine build and machine output.

### 43.2 Engineering concept

| Tool | Purpose | When |
|---|---|---|
| Quality gates | Formal go/no-go at lifecycle stages | G0–G10 (Book XII) |
| Inspection plans | What is checked, how, how often | Incoming, build, final |
| Cp, Cpk (short term); Pp, Ppk (long term) | Process capability relative to specification | FAT, SAT, ramp, production |
| GR&R / MSA | Is the measurement system good enough? | Before any capability or acceptance measurement |
| FMEA | Anticipate failures and their controls | Design, process, machine (Part 44) |
| Control plan | How each characteristic is controlled in production | From SAT onward |
| NCR | Record and disposition a nonconformance | Whenever found |
| CAPA | Corrective and preventive action with verification | After NCRs, audits, complaints |
| 8D | Structured team problem solving and reporting | Customer-visible or recurring problems |

### 43.3 Architecture — quality built into the machine

| Mechanism | Example |
|---|---|
| Error-proofing (poka-yoke) | Variant pins, asymmetric nests, part-size check by gripper jaw position |
| 100% in-machine verification of CTQs | Code grade on every part; weld monitoring on every joint |
| Recipe control | Recipe selected from part ID; parameter limits; version logging |
| State interlocks | No production if calibration expired, power check failed, filter Δp high |
| SPC on process parameters | Laser power, focus height, clamp force trended with limits |
| Positive reject handling | Reject confirmed in bin; quarantine for aborted parts |
| Traceability | Every record linked to part ID (Part 23) |

### 43.4 Components — inspection plan for machine build

| Stage | Checks | Method | Record |
|---|---|---|---|
| Incoming | First article (all characteristics); critical features on every lot; certificates | CMM, gauges, visual | FAI report, IQC log |
| Sub-assembly | Fits, torques, repeatability of nests and axes | Indicators, torque tools | Build book |
| Panel | Wiring, labelling, insulation, I/O | Point-to-point, test instruments | Panel test record |
| Integration | Alignments, calibrations, safety validation | Per Parts 35–36 | Calibration and validation records |
| Final | FAT per protocol | Part 38 | FAT report |

### 43.5 Design methodology

- Classify characteristics (critical, major, minor) for machine parts and for the product the machine makes.
- Run MSA on every gauge used for acceptance; fix gauges before measuring capability.
- Build inspection plans for incoming, build and final stages.
- Design in-machine verification and interlocks for product CTQs.
- Write the product control plan with the customer before SAT.
- Operate NCR, CAPA and 8D; review trends monthly.
8D steps

| Step | Content |
|---|---|
| D0 | Emergency response and containment need |
| D1 | Form the team |
| D2 | Describe the problem (is / is-not) |
| D3 | Interim containment |
| D4 | Root cause(s) of occurrence and of non-detection |
| D5 | Choose and verify permanent corrective actions |
| D6 | Implement and validate |
| D7 | Prevent recurrence (standards, FMEA, lessons learned) |
| D8 | Recognize the team and close |

### 43.6 Calculations

%GRR_(P/T)=(6 σ_(GRR))/(USL−LSL)×100

ndc=1.41 (σ_(part))/(σ_(GRR))

UCL_X, LCL_X=X±A_2R

Common acceptance: %GRR below 10% acceptable, 10–30% conditionally acceptable depending on application, above 30% unacceptable; number of distinct categories ndc ≥ 5. A₂ = 0.577 for subgroups of 5.

Examples: position tolerance 0.50 mm, σ_GRR = 0.008 mm → %GRR = 0.048 / 0.50 = 9.6% (acceptable); with part-to-part σ = 0.05 mm, ndc = 1.41 × 0.05 / 0.008 = 8.8. X̄-R chart for laser power with subgroups of 5, grand mean 49.6 W, R̄ = 0.8 W → limits 49.6 ± 0.46 W.

### 43.7 Industrial example — control plan extract for the marking process

| Characteristic | Specification | Method | Frequency | Reaction plan |
|---|---|---|---|---|
| Code grade | ≥ B (ISO/IEC TR 29158) | In-line DPM verifier | 100% | Reject part; after 3 consecutive rejects stop and check window, focus, power |
| Mark position | ±0.25 mm to datums | Offline measurement | 5 parts per shift | Out of limits: stop, check nest offsets and calibration |
| Laser power | 50 W ±5% | Power meter at work plane | Weekly; internal monitor every cycle | Adjust or service source; re-verify grade |
| Focus height | Recipe ±0.1 mm | Height sensor and focus test | Every part / weekly | Recalibrate Z; check part seating |
| Code content | Matches MES serial | Read-back comparison | 100% | Reject and alarm; block duplicate serials |

### 43.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| 100% in-line inspection vs sampling | Zero escapes, costs cycle time | Cheaper, delayed detection | 100% for CTQs with safety, traceability or high-cost escapes |
| Point Cpk vs confidence bound | Simple | Defensible | Confidence bound for critical CTQs (Part 38) |
| Build-in quality vs inspect-in | Prevents defects | Detects defects | Prevent first; inspect what cannot be prevented |

### 43.9 Common mistakes

- Measuring capability with an unqualified gauge.
- Treating short-term Cpk from FAT as long-term production capability.
- NCRs closed without root cause.
- Control plan written by the builder alone; the customer's quality team never adopts it.
- Interlocks that operators can bypass without trace.

### 43.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Capability varies between studies | Measurement variation, sampling differences | Repeat MSA; compare conditions | Fix gauge, standardize sampling | MSA before each study |
| False rejects rise | Gauge drift, lighting | Re-measure rejects offline | Recalibrate gauge | Daily master check |
| Same NCR recurs | Containment only | Review CAPA effectiveness | Real root cause, design change | Effectiveness check in CAPA |

### 43.11 Design checklist

- Characteristics classified for machine parts and product
- MSA / GR&R passed for all acceptance gauges
- Inspection plans for incoming, build and final stages
- In-machine verification, recipe control and state interlocks for product CTQs
- Control plan agreed with the customer before SAT
- NCR, CAPA and 8D processes active with monthly review

### 43.12 Key takeaways

- Prove the measurement system before trusting any capability number.
- Build quality into the machine with error-proofing, verification and interlocks.
- The control plan is the bridge from SAT to daily production.
- Close problems with verified root causes, not containment.
