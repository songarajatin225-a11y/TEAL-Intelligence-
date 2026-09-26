---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 31
part_title: "Part 24 — Machine vision"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 24 — Machine vision

Vision success is about 80% lighting and optics and 20% software. Specify from the tolerance backwards: required measurement uncertainty sets pixel size, pixel size and field of view set the camera, magnification and working distance set the lens, and the surface sets the lighting. For guidance, everything depends on a calibration that maps pixels into the machine's coordinate system.

### 24.1 Objective

Specify vision systems for presence, position, alignment, reading, inspection and measurement tasks, and implement vision-guided correction of motion or laser position with a known accuracy.

### 24.2 Engineering concept

The vision chain is: lighting → object → optics → sensor → acquisition → processing → decision → output. Contrast is created by lighting, preserved by optics, sampled by the sensor, and only then interpreted by software. Software cannot recover contrast the lighting never produced.

| Application | Typical tool | Key requirement | Common pitfall |
|---|---|---|---|
| Presence / absence | Blob, histogram, pattern match | Robust contrast | Background variation |
| Position | Pattern matching, edge, geometric search | Pixel size vs tolerance, calibration | Non-telecentric height error |
| Alignment | Fiducials, two-point or multi-point fit | Calibration to machine frame | Wrong coordinate convention |
| OCR (read text) | Trained or pretrained font reader | Character height ≥ ~20 px | Font variation, low contrast |
| OCV (verify text) | Compare with expected string and quality | Consistent print or mark | Over-tight quality thresholds |
| Barcode / QR / Data Matrix | Code reader, grading | Pixels per module, lighting angle for DPM | Reflections on metal |
| Defect inspection | Rule-based or deep learning | Defect examples, lighting that reveals defects | Too few bad samples |
| Measurement | Calipers, edge fitting, 3D profile | Uncertainty, GR&R | Ignoring lens distortion and temperature |

### 24.3 Architecture

| System type | Strengths | Limits | Best use |
|---|---|---|---|
| Code reader | Fast setup, built-in grading and lighting | Reading only | Traceability (Part 23) |
| Smart camera | Compact, self-contained, PLC-friendly | Limited processing and resolution | Presence, position, simple measurement |
| PC-based with industrial cameras | Flexible, many cameras, heavy algorithms, deep learning | IPC to maintain, integration effort | Alignment, multi-camera inspection |
| 3D (laser line, structured light, stereo) | Height, volume, warp | Speed, cost, surface effects | Weld seam, dispensing bead, warp |
| Line-scan | Continuous moving surfaces, high resolution | Needs encoder-synchronized motion | Web, large panels, cylindrical parts |

Vision → coordinate transformation → motion correction

*Figure 9. Vision guidance chain · 5 steps, calibration input, verification loop* — [Figure not transcribed; see source document]

Calibration is the arrow that makes everything else meaningful: a pattern match accurate to 0.1 pixel is useless if the pixel-to-millimetre scale is 0.5% wrong.

### 24.4 Components

| Component | Key specifications | Selection guidance |
|---|---|---|
| Camera | Resolution, pixel size, sensor size, frame rate, global vs rolling shutter, mono vs colour, interface | Global shutter for moving parts; mono unless colour is the feature |
| Lens | Focal length, working distance, magnification, aperture, depth of field, distortion, resolving power, mount | Lens must resolve the sensor's pixels; telecentric for measurement with height variation |
| Lighting | Geometry (ring, bar, dome, coaxial, dark-field, backlight, structured), wavelength, intensity, strobe | Dome or coaxial for shiny parts; low-angle dark-field for marks and scratches; backlight for silhouettes |
| Trigger | Hardware trigger, position compare, latency | Hardware for anything moving (Part 13) |
| Processing | Tools, deep learning, speed | Rule-based for measurement; deep learning for variable cosmetic defects |
| Calibration target | Dot or checkerboard grid of known accuracy | Target accuracy ≥ 10× the required measurement accuracy |

### 24.5 Design methodology

- Define the task, tolerance and decision in numbers.
- Collect samples: good, bad, borderline, across material and process variation.
- Compute the required pixel size from the tolerance (24.6).
- Choose FOV, sensor and resolution; then magnification, working distance and lens.
- Run lighting trials on real samples; pick geometry and wavelength by contrast measured, not by eye.
- Develop the algorithm on a sample set; hold back a test set.
- Calibrate intrinsics (scale, distortion) and extrinsics (camera to machine).
- Validate: GR&R for measurement, known-defect challenge set for inspection, read-rate test for codes.
- Integrate trigger, results, images and recipes with the PLC and MES.

### 24.6 Calculations

u=(T)/(10)

p_(obj)≤(u)/(s_(px))

N_(px)=(FOV)/(p_(obj))

m=(S_(sensor))/(FOV)

f≈(WD⋅m)/(1+m)

DOF≈(2 N c (1+m))/(m^2)

ε_(scale)≈(Δz)/(WD)

e_(height)≈r⋅(Δz)/(WD) (non-telecentric lens)

T = tolerance band; u = required measurement uncertainty (one tenth of the band); s_px = repeatable sub-pixel location of edges or patterns (≈ 0.1–0.25 px with good contrast); p_obj = pixel size at the object; N_px = pixels across the field of view; m = magnification; S_sensor = sensor width; WD = working distance; N = f-number; c = acceptable blur (≈ 1–2 pixels); r = distance of the feature from the optical axis; Δz = height change.

Worked example — fiducial alignment camera for laser marking. Tolerance on part position ±0.05 mm (T = 0.10 mm band); measurement uncertainty target 0.01 mm; sub-pixel repeatability 0.25 px → p_obj ≤ 0.04 mm. FOV 60 × 45 mm → at least 1,500 px across. A 5 MP camera (2,448 × 2,048, 3.45 µm pixels, 8.4 mm sensor width) gives p_obj = 60 / 2,448 = 0.0245 mm. m = 8.4 / 60 = 0.14; at WD = 300 mm, f ≈ 300 × 0.14 / 1.14 = 37 mm → 35 mm lens. DOF at f/8 with c = 6.9 µm (2 px): 2 × 8 × 0.0069 × 1.14 / 0.0196 = 6.4 mm. Height sensitivity: a 1 mm part-height change at WD 300 mm scales the image by 0.33%, moving a feature 30 mm from centre by 0.10 mm — the whole tolerance. Either fix part height, correct scale from a measured height, or use a telecentric lens.

### 24.7 Industrial example — vision-guided laser marking

Frames. Image (u, v in pixels) → camera plane (mm) → machine / galvo frame (X, Y in mm) → part frame (defined by two fiducial holes).

Calibration. A dot-grid plate is placed at the process height. The vision system fits scale, lens distortion and an affine or perspective transform from pixels to galvo coordinates. The laser then marks a cross grid on anodized plate; the camera measures the crosses, and the residual map closes the loop between laser and camera. This is repeated at FAT and after installation.

[XY1]=H[uv1]

θ=atan2(ΔY,ΔX)−θ_(nom)

[x′y′]=R(θ)[xy]+[t_xt_y]

Runtime numbers. Nominal fiducials at part coordinates (0, 0) and (50, 0); nominal machine position of the first fiducial (100.00, 50.00). Measured: F1 = (100.12, 49.95), F2 = (150.10, 50.30).

- Δ = (49.98, 0.35) → θ = atan(0.35 / 49.98) = 7.00 mrad (0.40°); translation t = F1 = (100.12, 49.95).
- Mark centre at part coordinates (25, 10) → rotated (24.930, 10.175) → machine (125.050, 60.125).
- Without correction the mark would land at (125.000, 60.000): an error of 0.135 mm, beyond the ±0.10 mm position tolerance. With correction the residual is the calibration and measurement uncertainty only.

### 24.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Smart camera vs PC-based | Simple, robust, cheap | Power, multi-camera, deep learning | Smart camera for single tasks; PC for alignment plus inspection suites |
| Standard vs telecentric lens | Small, cheap, wide FOV | No magnification change with height, low distortion | Telecentric for measurement with height variation; FOV limited to lens diameter |
| Mono vs colour | Higher resolution and sensitivity | Colour features | Mono with coloured light solves most colour tasks |
| Rule-based vs deep learning | Deterministic, explainable, measurable | Handles variable cosmetic defects | Rule-based for measurement and position; deep learning for classification with enough labelled images |
| 2D vs 3D | Fast, cheap | Height and volume | 3D for weld seams, bead volume, warp, stacking |
| Vision vs discrete sensor | Many features, variants | Fast, cheap, deterministic | Sensor for one binary state |

### 24.9 Common mistakes

- Choosing the camera before the lighting trials.
- Specifying resolution from "looks sharp" instead of tolerance and sub-pixel repeatability.
- Calibrating at one height and measuring at another with a non-telecentric lens.
- Too few bad samples for inspection; the system passes defects it never saw.
- Ambient light (windows, overhead lamps) changing results through the day.
- Different coordinate conventions (axis direction, angle sign) in vision and motion software.

### 24.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| False rejects rise over the day | Ambient light, lamp ageing, lens contamination | Compare images from morning and afternoon | Grey-level histograms | Shroud, strobe, clean, intensity control | Enclosed lighting, daily golden-sample check |
| Correction makes position worse | Sign or axis convention error, stale calibration | Move part by known offsets; compare reported offsets | Offset vs known move | Fix convention, recalibrate | Calibration verification in procedure |
| Position error grows at field edge | Lens distortion, height variation | Grid target at several heights | Error map | Distortion correction, telecentric lens, height compensation | Calibrate at process height |
| Blurred images | Motion, focus, vibration | Stationary vs moving images | Edge sharpness | Shorter exposure, strobe, refocus, damping | Blur calculation |
| Code no-reads on metal | Specular reflection | Try dome, dark-field, polarizer | Grade by lighting type | Change lighting geometry | Lighting trials on DPM |

### 24.11 Design checklist

- Task, tolerance and decision criteria defined numerically
- Sample set covers variation and defects; test set held back
- Pixel size justified by tolerance and sub-pixel repeatability
- Lens resolves sensor pixels; DOF covers height variation
- Lighting chosen by measured contrast; ambient light excluded
- Calibration method, target accuracy and frequency defined
- Coordinate conventions documented and shared with motion and laser software
- GR&R, challenge set or read-rate test defined for FAT

### 24.12 Key takeaways

- Lighting and optics decide success; software only interprets contrast.
- Size pixels from tolerance and sub-pixel repeatability.
- Calibration links pixels to machine motion; verify it with laser-marked grids.
- With standard lenses, height change is scale change — control it or measure it.
