---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 45
part_title: "Part 36 — Alignment and calibration"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 36 — Alignment and calibration

Alignment makes the machine geometrically right; calibration makes its measurements and coordinate systems agree with reality. Align mechanics first, then calibrate from the base outward — axes, fixtures, process tool, camera, robot TCP — using references at least four times more accurate than the tolerance, and record residuals so drift can be seen later.

### 36.1 Objective

Bring geometry, sensors and coordinate frames within the error budget, with documented methods, traceable references and re-check intervals.

### 36.2 Engineering concept

A machine is a chain of coordinate frames: base → axes → fixture (nest) → part → tool (laser field, TCP) → camera. Each link has a physical alignment and a numerical calibration. Calibrate in that order; a camera calibrated to a mis-squared gantry inherits the error.

### 36.3 Architecture — what is aligned and calibrated

| Item | Alignment (physical) | Calibration (numerical) | Typical tools |
|---|---|---|---|
| Frame and base | Level, flatness of mounting faces | — | Precision level (0.02 mm/m), straightedge, autocollimator |
| Linear axes | Rail parallelism and straightness, screw alignment | Pitch error mapping, backlash compensation | Dial indicators, laser interferometer |
| Axis squareness | Mechanical squaring of gantry or stacked axes | Squareness compensation | Granite square, ballbar, diagonal measurement |
| Laser beam path | Mirror alignment, centring in galvo aperture | Focus position, power, field correction, delays | Irises, beam profiler, power meter, marked grid plates |
| Camera | Mount, focus, aperture | Intrinsics (scale, distortion), extrinsics, camera-to-galvo or camera-to-robot | Calibration plates, marked grids |
| Fixtures | Pin and pad positions | Per-nest offsets | Probe, marked test parts, CMM |
| Sensors | Mounting position | Offset and gain (pressure, force, displacement, temperature) | Reference gauges, weights, gauge blocks, reference thermometers |
| Robot | Base mounting | TCP, user frames, base frame | Pointer tools, reference spheres |

### 36.4 Components — references and traceability

Every reference used for acceptance (gauges, weights, power meters, calibration plates) needs a valid certificate traceable to national standards (in India through NABL-accredited laboratories). Keep a calibration register: instrument, ID, range, uncertainty, due date.

### 36.5 Design methodology

- Warm up the machine (motion and process) to operating temperature.
- Align frame and axes; record parallelism, straightness and squareness.
- Map axis errors with the interferometer; load compensation tables; re-measure residuals.
- Align the laser beam path; find focus; calibrate power at the work plane.
- Calibrate the scan field with marked grid plates; iterate the correction table.
- Calibrate the camera (intrinsics, then to machine or galvo); verify with laser-marked crosses.
- Calibrate fixtures (per-nest offsets) and sensors.
- Teach robot TCP and frames; verify at several orientations.
- Record everything: method, reference, raw data, residuals, date, person.
- Set re-check intervals and quick verification routines for production.

### 36.6 Calculations

γ≈(d_1^2−d_2^2)/(4 a b)

TUR=(T)/(U_(ref))≥4

RMS_(res)=√((1)/(n)∑_(i=1)^n e_i^2)

γ = squareness error (rad) of a rectangle with sides a, b and measured diagonals d₁, d₂; TUR = test uncertainty ratio between tolerance T and reference uncertainty U_ref; RMS_res = root-mean-square residual after calibration over n check points.

Squareness example. A 300 × 300 mm square marked by the gantry measures diagonals differing by 0.03 mm: d₁² − d₂² ≈ 0.03 × 848.5 = 25.5 mm² → γ = 25.5 / (4 × 300 × 300) = 71 µrad → 21 µm across 300 mm. Either re-square mechanically or enter a squareness compensation.

Reference adequacy. For a ±20 µm tolerance, the reference must be better than ±5 µm (TUR ≥ 4); a vernier caliper is not a calibration reference.

### 36.7 Industrial example — calibration plan of the marking cell

| Item | Method | Reference | Acceptance | Re-check interval |
|---|---|---|---|---|
| Shuttle positions | Dial indicator at both stations, 30 repeats | Indicator 1 µm | Repeatability ≤ ±5 µm | At SAT, then yearly |
| Galvo field | Mark 11 × 11 cross grid on anodized plate; measure with vision or measuring microscope | Certified grid plate or microscope | RMS residual ≤ 15 µm, max ≤ 30 µm | At SAT; after lens or galvo change |
| Focus | Ramp test across Z | Recipe focal plane | Best focus ±0.1 mm | Weekly quick check |
| Laser power | Power meter at work plane | Calibrated power meter | Within ±5% of setpoint | Weekly |
| Camera to galvo | Laser-marked crosses measured by camera | Grid plate | Residual ≤ 20 µm | At SAT; after camera or galvo change |
| Nest offsets | Mark test part in each nest; measure against datums | CMM or measuring microscope | Nest-to-nest ≤ 20 µm after offset | Monthly |
| Height sensor | Gauge blocks at three heights | Grade-1 gauge blocks | ±10 µm | Quarterly |

### 36.8 Design trade-offs

| Trade-off | Mechanical accuracy | Software compensation | Guidance |
|---|---|---|---|
| Stability | Independent of software and data | Depends on data staying valid | Mechanics for random and unstable errors; compensation for repeatable systematic errors |
| Cost | Tighter parts, skilled alignment | Measurement equipment and time | Compensate where measurement is cheaper than precision |
| Serviceability | Parts replaceable without recalibration if accurate | Recalibration after part changes | Define which part changes trigger recalibration |

### 36.9 Common mistakes

- Calibrating a cold machine that runs warm.
- Calibrating the camera before squaring the axes.
- References without certificates, or with TUR below 4.
- No record of residuals, so later drift cannot be distinguished from original error.
- Replacing a galvo or lens without recalibrating the field.

### 36.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Calibration good in the morning, off in the afternoon | Thermal drift | Repeat check at intervals over a day | Residual vs temperature | Warm-up, thermal isolation, temperature compensation | Calibrate at operating temperature |
| Residuals will not reduce | Non-repeatable error (play, loose mount) | Repeatability test before calibration | Repeatability vs residual | Fix mechanics first | Repeatability gate before calibration |
| Correct at centre, wrong at edges | Distortion model too simple, height variation | Full-field grid at two heights | Error map | Higher-order correction, telecentric optics | Full-field acceptance |
| Frames disagree (camera vs laser) | Calibrated in different sequences or conditions | Mark-and-measure loop | Offset between frames | Recalibrate in the defined order | Calibration order in procedure |

### 36.11 Design checklist

- Calibration order defined: base → axes → fixtures → tool → camera → robot
- Warm-up condition defined for calibration
- References certified and traceable; TUR ≥ 4
- Methods, acceptance criteria and residual records for each item
- Re-check intervals and quick verification routines in the maintenance plan
- Part replacements that trigger recalibration listed in the service manual

### 36.12 Key takeaways

- Align mechanics first; compensation cannot fix play.
- Calibrate from the base outward, warm, with traceable references.
- Record residuals; they are the baseline for every future drift question.
- Define what triggers recalibration after service.
