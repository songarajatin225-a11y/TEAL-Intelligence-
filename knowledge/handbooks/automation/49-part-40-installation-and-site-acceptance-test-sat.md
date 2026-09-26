---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 49
part_title: "Part 40 — Installation and site acceptance test (SAT)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 40 — Installation and site acceptance test (SAT)

SAT proves the machine performs in the customer's real environment, with the customer's utilities, network, parts and people. It succeeds when the site was verified ready before the machine arrived, the installation restored the recorded references, and the protocol concentrates on what FAT could not prove: site utilities, live MES, multi-day run-at-rate and trained operators.

### 40.1 Objective

Install, recommission and accept the machine at site with signed evidence, and hand over for production.

### 40.2 Engineering concept

| Aspect | FAT (builder's site) | SAT (customer site) |
|---|---|---|
| Utilities | Builder's supply | Customer's real supply quality |
| Data | Simulated MES | Live MES, customer network and IT security |
| Parts | Sample lots | Production flow and variation |
| Duration | Hours | Days (run-at-rate) |
| People | Builder technicians | Customer operators and maintenance |
| Qualification | Operational (OQ) | Performance (PQ) |

### 40.3 Architecture — installation sequence

- Site readiness check (Gate 9 precondition): floor flatness and load, anchors or isolator positions, space and access route, every utility measured against the utility requirement sheet (Part 31), network ports and IT accounts, environment, permits and lock-out/tag-out arrangements, customer resources.
- Receive and inspect crates and indicators with the carrier; photograph.
- Rig and position using the lifting plan; mark the footprint first.
- Level to the recorded frame values; anchor or set isolators.
- Reassemble modules on dowels; reconnect using matchmarks and photos.
- Connect utilities: electrical by the customer's electrician to the machine isolator; verify voltage, phase rotation and earthing; air, water, gases, exhaust, network.
- Remove transport locks using the lock list; confirm each removed.
- Staged power-up (Part 35); restore software and parameters from backups.
- Re-validate safety functions and re-measure stopping times.
- Re-measure references (level, squareness, calibration residuals); recalibrate only what exceeds limits (Part 36).
- Process verification on production parts; adjust recipes within validated windows.
- Trial production, then SAT.

### 40.4 Components — SAT protocol template

| # SAT protocol — [machine ID] at [site] References: URS [rev], SRS [rev], FAT report [no.], deviation list [no.]  ## 1. Preconditions - Site readiness checklist signed (utilities measured values attached) - FAT class B deviations and their closure plan  ## 2. Tests \| SAT ID \| Requirement \| Procedure \| Acceptance \| Result \| Evidence \| Sign \|  ## 3. Run-at-rate Duration, shifts, variants, stop-reason logging, OEE calculation method  ## 4. Training Operators, technicians, engineers: attendance and competence check records  ## 5. Documentation handover Manuals, drawings as-built, spare list, software backups, calibration certificates, safety documents  ## 6. Acceptance Open items with owners and dates · Acceptance certificate · Warranty start date |
|---|

### 40.5 Design methodology

- Issue the site readiness checklist with the utility requirement sheet at Gate 2; follow up monthly.
- Plan installation: people, tools, lifting, duration, customer support, permits.
- Execute installation per 40.3 with daily reports.
- Run SAT tests; log every stop reason during run-at-rate.
- Train and assess operators and maintenance staff.
- Hand over documentation and backups; sign acceptance with the open-item list.

### 40.6 Calculations

OEE_(SAT)=(N_(good)⋅CT_(ideal))/(T_(plan))

Δh=s⋅L

OEE_SAT = measured OEE during run-at-rate; Δh = height difference across length L for a level reading s (for example 0.02 mm/m).

Example: 3-day run-at-rate, T_plan = 3 × 22 h = 237,600 s; CT_ideal = 6.82 s design basis from Part 4 (the machine's own ideal is 5.3 s, but OEE is judged against the contract basis agreed in the SAT protocol); N_good = 30,540 → OEE = 30,540 × 6.82 / 237,600 = 87.7%, above the 86.1% target. Levelling: a reading of 0.02 mm/m over a 3 m frame means 0.06 mm end-to-end.

### 40.7 Industrial example — SAT test list extract, marking cell

| SAT ID | Requirement | Procedure | Acceptance |
|---|---|---|---|
| SAT-01 | Site utilities | Measure voltage, air pressure and quality, exhaust flow at machine | Within utility sheet values |
| SAT-03 | Safety re-validation | Repeat SF1–SF6 tests; measure stopping times | Per SRS; distances confirmed |
| SAT-05 | Calibration | Re-measure references; galvo field and nest checks | Residuals within limits |
| SAT-06 | Code quality | One shift of production, 100% in-line grading | All ≥ grade B; offline audit of 30 parts |
| SAT-09 | Run-at-rate | 3 days, both variants, stop reasons logged | Good output and OEE per contract |
| SAT-12 | Live MES | Production records to MES; 1 h network disconnection | 100% records delivered once, in order |
| SAT-14 | Training | Operator and technician sessions with competence checks | Signed records for named staff |
| SAT-15 | Documentation | Handover checklist | All items delivered |

### 40.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Short SAT vs long run-at-rate | Faster acceptance | Proves reliability in real conditions | At least one full production cycle of shifts; three days for new platforms |
| Builder vs customer operators in SAT | Builder hits rate | Proves the customer can run it | Customer operators in the final run, builder supporting |
| Full recalibration vs verification | Certainty | Faster | Verify first; recalibrate only what fails |

### 40.9 Common mistakes

- Arriving at a site that is not ready; days lost waiting for utilities.
- Skipping safety re-validation after installation.
- Run-at-rate with builder technicians only.
- Live MES tested for the first time at SAT.
- Acceptance signed without the documentation handover.

### 40.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Performance lower than FAT | Utilities weaker, parts different, operators new | Compare stop reasons and utilities with FAT | Fix utilities, adjust recipes, coach operators | Site readiness verification, early production samples |
| Accuracy lost | Levelling, transport distortion | Re-measure references | Re-level, re-square, recalibrate | Recorded references |
| MES integration issues | Firewall, accounts, data format | Network capture, MES logs | Correct configuration | IT alignment at G2 and a pre-SAT connectivity test |
| Nuisance safety trips | Site lighting, vibration, reflections | Diagnostics log | Adjust mounting, shielding | Site survey before install |

### 40.11 Design checklist

- Site readiness verified with measured utility values before shipment
- Installation plan with lifting, permits and customer support
- Transport locks removed and recorded
- Safety functions re-validated
- References re-measured; recalibration where needed
- Run-at-rate with customer operators; stop reasons logged
- Live MES and offline recovery tested
- Training records and documentation handover complete
- Acceptance certificate with open-item list signed

### 40.12 Key takeaways

- Verify the site before the machine leaves the shop.
- Restore recorded references; recalibrate only what fails.
- SAT proves what FAT cannot: site utilities, live MES, days at rate, customer people.
- Acceptance includes documents and trained staff, not just output.
