---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 8
part_title: "Part VII — Galvo Scanning and Motion"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part VII — Galvo Scanning and Motion

A galvo scanner moves the beam at metres per second by rotating two lightweight mirrors, while mechanical stages move the part at a tenth of that speed. Most laser machines combine the two: scanners for speed within a field of 50–300 mm, stages or robots for reach, and a controller that synchronises laser firing with actual position.

## 7.1 Scanner technologies

| Scanner | Principle | Speed / bandwidth (≈) | Angle / field | Typical use |
|---|---|---|---|---|
| X/Y galvanometer (2D) | Moving-magnet motor with closed-loop position sensor rotates each mirror | Mark 1–5 m/s (to ~10 m/s); jump 5–20 m/s; small-step response ~0.1–0.4 ms (10 mm aperture) | ±~20–25° optical; field ~0.7 × f | Marking, micromachining, remote welding, AM |
| 3D scanner | 2D galvo + dynamic focus (z-shifter lens before the mirrors) | As 2D; z-range mm to tens of mm | Pre-objective: large fields with variable focus | Curved and stepped parts, deep engraving, large-field welding and AM |
| Polygon scanner | Rotating multi-facet mirror gives a constant-speed line | Tens to > 100 m/s surface speed | One axis; second axis from galvo or stage | High-rep-rate ultrafast large-area ablation, LDI, texturing |
| Resonant scanner | Mirror driven at mechanical resonance, sinusoidal motion | kHz line rates | Fixed amplitude | Imaging, LiDAR, some texturing |
| Voice-coil / fast steering mirror | Voice-coil actuators, small angles, high bandwidth | Hz–kHz | ±1–5° | Beam stabilisation, wobble, focus shifters |
| Piezo tip/tilt | Piezo actuators | kHz, µrad resolution | mrad range | Fine positioning, wobble, closed-loop pointing |
| MEMS mirror | Micro-machined silicon mirror | kHz resonant | Few mm apertures, low power | LiDAR, projection, compact sensing |
| Acousto-optic deflector (AOD) | Acoustic grating deflects the beam | µs access time | Small angle | Micro-via drilling (with galvo), multi-beam writing |
| Rotating wedges / Risley prisms / dove prism | Rotating optics spin the beam | Thousands of rpm | Small circles | Helical and trepanning drilling heads |

## 7.2 Galvo architecture and parameters

The controller streams position commands (XY2-100 protocol is 16-bit; newer protocols such as SL2-100 are 20-bit) and switches the laser gate in step with mirror motion. On a 110 mm field, 16 bits is ~1.7 µm per step; 20 bits is ~0.1 µm.

| Parameter | Meaning | Typical (≈) | Engineering note |
|---|---|---|---|
| Aperture | Largest beam the mirrors accept | 7, 10, 14, 20, 30, 50 mm | Larger aperture → smaller spot, more inertia, lower speed |
| Mark speed | Speed while writing | 0.5–5 m/s | Limited by pulse overlap and material response, not only the scanner |
| Jump speed | Speed while moving with laser off | 5–20 m/s | Limits cycle time for sparse marks |
| Acceleration / step response | Time to settle after a small step | 0.1–0.4 ms | Governs corner quality and short vectors |
| Tracking error | Lag between command and actual mirror position | 0.1–0.5 ms | Compensated by delays or feed-forward control |
| Field size | Usable area at focus | f 100 → ~70 mm; f 160 → ~110 mm; f 254 → ~175 mm; f 330 → ~220 mm; f 420 → ~290 mm (square fields) | Spot grows proportionally with f |
| Distortion | Pincushion from the two-mirror geometry plus lens residuals | Corrected to ~±10–50 µm over field with calibration | Calibrate by marking a grid and measuring with vision |
| Drift | Position change with temperature and time | µrad-level repeatability; tens of µrad drift | Temperature-stabilised scanners for precision work |

Scanner delays — the most common source of poor mark quality after focus errors:

| Delay | What it compensates | Too short | Too long |
|---|---|---|---|
| Laser-on delay | Mirror still accelerating at vector start | Burn dot at start | Missing start of line |
| Laser-off delay | Mirror lag at vector end | Missing end of line | Burn dot at end |
| Jump delay | Settling after a jump | Wavy start, position error | Lost cycle time |
| Mark delay | Settling after a mark vector | Rounded corners | Lost cycle time |
| Polygon (corner) delay | Direction change inside a polyline | Rounded corners | Burned corners |

Skywriting removes most delay tuning: mirrors accelerate and decelerate outside the vector with the laser off, so every vector is written at constant speed.

## 7.3 Scan strategies

| Strategy | Description | Use | Watch-outs |
|---|---|---|---|
| Unidirectional hatch | Parallel lines written one way | Uniform ablation and black marks | Slower (return jumps) |
| Bidirectional hatch | Zig-zag lines | Fast area filling | Needs delay tuning to avoid comb edges |
| Cross-hatch / rotated hatch | Hatch angle changes per pass (0°/90°, or 67° rotation) | Uniform depth in deep engraving and AM | More passes |
| Contour / offset | Outline passes around the fill | Clean edges on logos, pockets, cuts | Extra time |
| Multi-pass with interlacing | Several low-energy passes, alternating regions | Heat management on plastics, glass, thin parts | Registration between passes |
| Island / randomised order | Field split into cells written out of sequence | Distortion control in welding and powder-bed AM | Path planning complexity |
| Wobble | Circle, figure-8 or ∞ oscillation on the weld path | Gap bridging, reduced porosity in Al and Cu welding | Frequency–speed matching |
| Trepanning / spiral | Circular or spiral paths | Drilling, cutting holes | Taper control |
| Marking on the fly (MOTF) | Encoder-tracked marking of moving parts | Conveyor coding, cables, packaging | Encoder resolution and latency |
| Stage–scanner synchronisation | Scanner and XY stage move together along one path | Fields larger than the lens without stitching seams | Needs coordinated controller |

Hatch and pulse spacing are normally 0.5–0.8 × spot diameter for uniform area removal; see the overlap formula in §2.9.

## 7.4 Motion systems

| Axis type | Drive | Accuracy / repeatability (≈) | Speed / acceleration (≈) | Typical use |
|---|---|---|---|---|
| Ball-screw linear stage | Servo or stepper | ±5–20 µm / ±2–5 µm | 0.1–0.5 m/s | Marking and welding workstations |
| Linear-motor stage | Direct linear motor, optical encoder | ±1–5 µm / < 1 µm | 1–3 m/s; 1–3 g | Micromachining, PCB, display |
| Air-bearing stage | Linear motor on air bearings; interferometer option | Sub-µm / tens of nm | 0.5–1 m/s | Wafer processing, dicing, inspection |
| Gantry | Dual-drive (gantry-yaw control), rack-and-pinion or linear motor | ±20–50 µm (cutting) | 100–200 m/min; 1–3 g | Sheet cutting, large-format processing |
| Rotary axis | Direct-drive torque motor or worm gear | arc-seconds | 100s rpm | Cylinders, rings, tubes, cells |
| SCARA robot | Four-axis articulated arm | ±10–20 µm repeatability | High | Pick-and-place, soldering, small welding |
| Six-axis robot | Articulated arm | ±0.02–0.1 mm repeatability; path accuracy several times worse | m/s | Remote welding, cladding, cleaning, 3D cutting |
| Conveyor | Belt, chain, pallet systems | Positioning by stops or vision | Line speed | In-line marking, EMS lines |

Three control features separate precision machines from basic ones: position-synchronised output (PSO), which fires the laser at fixed distance intervals regardless of speed changes; stage–scanner coordination for seamless large fields; and error mapping (ISO 230-2 style) that corrects each axis for pitch, straightness and Abbe errors.
