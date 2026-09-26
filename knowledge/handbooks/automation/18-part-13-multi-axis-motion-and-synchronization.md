---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 18
part_title: "Part 13 — Multi-axis motion and synchronization"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 13 — Multi-axis motion and synchronization

When two things must happen at the same place, time them by position in hardware, never by software timers. The worked numbers below show why: a 1 ms software trigger at 0.5 m/s misplaces a camera image or laser pulse by 0.5 mm, while a hardware position-compare output does it to under a micron.

### 13.1 Objective

Choose the multi-axis kinematics and coordination method, and specify synchronization between motion, laser, galvo, camera, robot and conveyor so that position errors from timing stay inside the error budget.

### 13.2 Engineering concept

| Coordination method | Relationship | Typical use |
|---|---|---|
| Independent point-to-point | Axes move separately; PLC sequences them | Simple handling |
| Master/slave (electronic gearing) | Slave position = ratio × master position | Conveyor-synchronous tools, dual-drive gantries |
| Electronic cam | Slave position = f(master position), from a table or polynomial | Flying cut-off, pick-from-moving-belt, indexing profiles |
| Coordinated (interpolated) motion | Axes follow a path together (linear, circular, spline) | Dispensing, contour welding, cutting |
| Kinematic transformation | Joint axes mapped to Cartesian space | Robots, delta, SCARA, 5-axis heads |
| Position-synchronized output (PSO / position compare) | Hardware output fires at encoder positions | Laser firing, camera triggering, stitching |

### 13.3 Architecture — multi-axis configurations

| Configuration | Structure | Strengths | Limits | TEAL use |
|---|---|---|---|---|
| Stacked XY stage | Y rides on X | Simple, compact | Lower axis carries upper axis mass; Abbe errors accumulate | Small precision tables |
| Split-axis XY | X moves part, Y moves tool on a bridge | Decoupled dynamics, stiff | Larger footprint | Wafer and panel processing |
| XYZ Cartesian | Three orthogonal axes | Intuitive, accurate | Workspace = box, cables | Dispensing, inspection |
| Gantry, single drive | One motor drives both sides by shaft or belt | Cheap, self-squaring | Torsional wind-up, lower stiffness | Light handling |
| Gantry, dual drive | Motor per side, yaw-controlled | Stiff, fast, large area | Squaring and cross-coupling needed | Busbar welding, large marking |
| H-bot / CoreXY | Belts, fixed motors | Low moving mass | Belt compliance, racking | Light pick-and-place |
| Galvo scanner | Two mirrors steer the beam | Very fast beam motion | Limited field, field distortion | Marking, welding, cutting |
| Stage + galvo (extended field) | Stage and scanner share the path | Large area with galvo speed | Complex trajectory splitting | Large-panel processing |

### 13.4 Components for synchronization

| Component | Function | Key specification |
|---|---|---|
| Motion controller with fieldbus sync (e.g. EtherCAT distributed clocks) | Common time base for all axes | Cycle time, jitter (µs) |
| Position-compare / PSO output | Fire output at encoder positions | Latency, max rate, number of channels |
| Encoder latch (touch probe) input | Capture position at an external event | Latch latency |
| Scanner controller (galvo card) | Executes vectors, laser gating, delays | Vector rate, delay resolution, encoder inputs for on-the-fly |
| Hardware-triggered camera and strobe | Capture at a precise instant | Trigger latency and jitter, exposure range |
| Conveyor encoder | Measure belt position for tracking | Resolution, mounting without slip |

### 13.5 Design methodology

- List every event that must coincide with a position (fire, capture, pick, dispense start).
- For each, compute the allowed timing error: Δt_max = e_allowed / v.
- If Δt_max is below ~1 ms, use hardware synchronization (position compare, latch, distributed clocks).
- Choose the coordination method (13.2) for each axis group.
- For gantries, choose single or dual drive; for dual drive, define squaring, yaw control and homing.
- For interpolated paths, add velocity and acceleration feedforward and match loop gains across axes.
- Calibrate delays (laser, scanner, camera) on test patterns; record them in the recipe.
- Verify with test patterns at full speed, not at jog speed.

### 13.6 Calculations

Δx_(timing)=v⋅Δt

b_(blur)=v⋅t_(exp)

Δr≈(v^2)/(2RK_v^2)

θ_(slave)=G⋅θ_(master)

d_(on-fly)=v_(conv)⋅t_(process)≤W_(field)−W_(mark)

Δx_timing = position error from a timing error Δt at velocity v; b_blur = motion blur during exposure t_exp (keep below ~0.5 pixel); Δr = radius shrink of a circle of radius R interpolated at speed v by proportional position loops with gain K_v and no feedforward; G = gearing ratio; d_on-fly = travel of a part on a conveyor during processing time t_process, which must fit in the scan field width W_field minus the mark width W_mark.

Worked numbers

| Case | Inputs | Result | Consequence |
|---|---|---|---|
| Software-timed camera trigger | v = 0.5 m/s, Δt = ±1 ms (PLC scan jitter) | ±0.5 mm | Unacceptable for alignment; use position compare |
| Hardware position compare | v = 0.5 m/s, Δt ≈ 1 µs | ±0.5 µm | Negligible |
| Motion blur | v = 0.5 m/s, t_exp = 50 µs, pixel at object = 50 µm | 25 µm = 0.5 px | Acceptable; shorter exposure with strobe if tighter |
| Circular dispensing path | v = 0.1 m/s, R = 5 mm, K_v = 50 s⁻¹ | Δr = 0.4 mm | Circle 0.8 mm too small; feedforward and higher bandwidth needed |
| Marking on the fly | v_conv = 0.2 m/s, t_mark = 0.3 s, field 110 mm, mark 20 mm | Part travels 60 mm ≤ 90 mm | Feasible without stopping the conveyor |
| Laser-off delay error | Mark speed 2,000 mm/s, delay wrong by 100 µs | 0.2 mm line-end error | Calibrate delays on a test pattern |
| Robot picking from conveyor | v_conv = 0.3 m/s, image-to-pick latency 150 ms | Part moves 45 mm | Latch conveyor encoder at image trigger; robot tracks from that position |

### 13.7 Industrial example — four synchronization problems in TEAL machines

Laser + galvo. The scanner controller executes vectors and gates the laser. Five delays align laser emission with mirror motion: laser-on delay (mirrors reach speed before emission), laser-off delay (emission stops at the line end), jump delay (mirrors settle after a jump), mark delay (settle after the last mark vector), polygon delay (corner settling). Symptoms of wrong delays: dots at line starts, missing line ends, rounded corners, ghost lines. Calibrate on a standard test pattern at production speed and store the delays per recipe.

Camera + motion. For on-the-fly inspection, the motion controller's position-compare output triggers the camera and strobe at programmed encoder positions. The image position is then known to encoder accuracy, and blur is controlled by the strobe pulse, not the camera shutter.

Robot + conveyor. A conveyor encoder feeds the robot controller. When a vision image is taken, the conveyor position is latched; the robot converts the part's image coordinates into conveyor coordinates and tracks the part within a defined pick window. Latency is irrelevant as long as the latch is hardware-timed.

Pick-and-place axes. Overlap Z-down with the end of the XY move (blending) when the path clears obstacles; this typically cuts 15–30% from a pick-place cycle. S-curve profiles reduce residual vibration at the pick point, so settle time falls even though the move takes slightly longer.

Dual-drive gantry (Part 5 welding cell). Each side has its own motor and linear encoder. The controller runs both as a gantry pair: common position command plus a yaw loop holding the difference near zero. Homing squares the gantry to reference marks on both rails; a skew limit (e.g. 0.2 mm) trips a fault before the structure is stressed.

### 13.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Stop-and-process vs on-the-fly | Simpler, more accurate | Higher throughput, no stop time | On-the-fly when stop/start time exceeds ~30% of process time |
| Galvo only vs stage + galvo | Fast within the field | Large area without stitching marks | Stage + galvo when features exceed the field and stitching is unacceptable |
| Single-drive vs dual-drive gantry | Cheap, self-squaring | Stiff, fast, controllable yaw | Dual drive beyond ~1 m span or high acceleration |
| Software vs hardware sync | Flexible, easy | Deterministic, precise | Hardware whenever Δt_max < ~1 ms |
| Integrated vs separate scanner control | One programming environment | Best-in-class scanner features | Separate scanner card with fieldbus or I/O handshake for demanding laser work |

### 13.9 Common mistakes

- Triggering cameras or lasers from PLC logic at speed.
- Tuning each axis alone, then finding contour errors because gains differ between axes.
- Setting scanner delays at slow speed and running production fast.
- Homing a dual-drive gantry without squaring; the structure carries a permanent twist.
- Encoder on a conveyor drive shaft instead of an idler, so belt slip goes unmeasured.

### 13.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Mark or image position shifts with speed | Software timing, latency | Run at two speeds; plot error vs speed | Slope = latency | Hardware trigger or latency compensation | Δt_max analysis at design |
| Rounded or burnt corners in laser vectors | Polygon or mark delay wrong | Standard test pattern | Corner geometry | Recalibrate delays | Delays per recipe, verified at FAT |
| Circles too small, ovals | Following error, mismatched gains | Circular test (ballbar or pattern) | Radius and ovality | Feedforward, match gains | Contour test at integration |
| Gantry skew fault | Squaring lost, one side binding | Log both encoders during moves | Skew vs position | Re-square, fix binding | Skew monitor and limit |
| Robot misses moving parts | Conveyor encoder slip, calibration | Pick static parts on a stopped belt | Offset vs belt position | Encoder on idler, recalibrate conveyor frame | Conveyor calibration in SAT |

### 13.11 Design checklist

- Every position-coincident event listed with Δt_max
- Hardware synchronization used where Δt_max < ~1 ms
- Coordination method chosen per axis group
- Dual-drive gantries have squaring, yaw control and skew limits
- Feedforward and matched gains on interpolated axes
- Laser and scanner delays calibrated at production speed and stored per recipe
- Motion blur and trigger jitter within vision budget
- Full-speed test patterns defined for FAT

### 13.12 Key takeaways

- Position error from timing = velocity × timing error; at speed, only hardware sync is good enough.
- Scanner delays are process parameters; calibrate them at production speed.
- Interpolated paths need feedforward and matched axes, not just higher gain.
- Latch the conveyor position when the image is taken, and latency stops mattering.
