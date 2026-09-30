# 10 — 3D Machine Simulator + Digital Twin Studio

The 3D machine simulator is part of the **Equipment Simulation Studio**, not a separate app. Every simulation scenario has a **3D machine** tab (`/studio/:id?tab=machine3d`). The flagship demo is the **semi-automatic laser marking machine** (`sim-demo-laser-marker`, shortcut `#/3d`).

> **3D conceptual digital twin**: an engineering simulation model, not a CAD manufacturing release. The first release covers **3D engineering, kinematics, sequence and material flow**. It is not CAD, CFD, FEA, optical ray tracing, certified safety simulation, a PLC runtime or a factory-validated physics model.

## Architecture

| Layer | File | What it does |
|---|---|---|
| Twin inputs (schema) | `src/domain/engineering.ts` → `Simulation.twin` | Holds only what the model needs beyond the stations: workpiece, process area, axes, per-part moves, camera working distance, layout overrides, zones, snapshots, recorded runs and factory placement. |
| Motion engine | `src/services/twin/motion.ts` | Axis model (§17). Travel, speed and acceleration come from the linked stage record unless you enter them. Moves use a trapezoidal or triangular profile, or a **jerk-limited S-curve** when a jerk limit is entered. An in-position **settling time** is added when it is entered; when it is not, it is left out and the scenario says so (§18). |
| Canonical cycle | `src/services/sim/model.ts` (`addMotion`, `transferModel`) | Axis move time is **calculated** and added to the station time. The 3D cycle is therefore the simulated cycle (§69). A missing axis speed blocks the run with an input gap and is never assumed. On an inline line the **part transfer** to the next station is added too. The distance is entered; the speed is entered or read from the selected conveyor's max speed. Without a distance the transfer is not included, and the Studio says so. |
| Machine architect | `src/services/twin/architect.ts` | **Builds the machine from its components** (build mode *components*). Deterministic rules read the chosen components, the process and the automation level, and derive the stations, their slots, the selections and the PLC sequence. Every station names its rule and the components that triggered it; gaps and unused parts are stated. Station times already entered are kept. See *Build from components* below. |
| Machine generator | `src/services/twin/machine.ts` | Builds the conceptual scene graph from stations and selected components (§8–§13, §118–§120). Every object carries `partId`, `stationKey`, layer and BOM level, and links to its BOM line. It also computes camera FOV (§31), laser beam path and field, safety zones, cable routes and the conceptual I/O list. |
| Kinematics | `src/services/twin/kinematics.ts` | SCARA two-link and **6-axis articulated** inverse/forward kinematics (the robot record's number of axes picks the type), pick-and-place phases (to pick → descend → grip → lift → to place → lower → release → retract) and tool strokes. Poses are a function of the station's progress, so the same central state drives robots, gantries and tool heads. Geometry only; no dynamics (§16). |
| Sequence preview | `src/services/twin/preview.ts` | When station inputs are missing, the machine still runs as a **sequence preview**: every undefined station gets the same 2 s visual placeholder, with no variability or failures. Nothing from a preview is reported as a result (§161, §162). |
| Utilities | `src/services/twin/utilities.ts` | Electrical power and extraction airflow read only from the selected components' records. It gives live power for the stations working now and energy per part. Components without a value are listed; nothing is estimated (§97). |
| Collision | `src/services/twin/collision.ts` | Axis-aligned bounding boxes, sampled along every planned move and along every **robot / gantry gripper path**, including the part it carries (§20). Exposes the `PhysicsProvider` interface: bounding-box collision is active; rigid-body, robotics, optical and thermal/FEA are future extension points. |
| Sequence + central state | `src/services/twin/timeline.ts` | `TwinPlayer` wraps **one** seeded DES run (`services/sim/des`). Its `at(t)` is the single `SimulationState` read by the scene, event log, KPIs, HMI, alarms and I/O (§45, §46). Station time is split into sub-steps only where the data allows (axis moves, entered laser jump overhead); the remainder keeps the station's basis. |
| Design check | `src/services/twin/checks.ts` | Rules for f-theta field vs process area, camera FOV vs target, axis travel, collisions, throughput vs target, footprint and enclosure. It reuses the Studio design review (§114, §178). |
| Process paths | `src/services/twin/process.ts` | Symbolic marking, welding, cutting, cleaning, drilling and scribing paths inside the process area. Visual only; they are never used for cycle time. |
| 3D library | `src/features/twin/three/procedural.tsx` | Parametric procedural components registered by generator key (§119, §120) and the restrained industrial material set (§121). |
| Scene | `src/features/twin/three/MachineScene.tsx` | React Three Fiber scene. Covers views, orthographic/perspective, section, explode, X-ray, layers, overlays, measure, beam and scan, FOV, zones, dimensions, comparison ghost, factory boxes, performance monitor, debug stats and screen-space labels. |
| Workbench | `src/features/twin/MachineTab.tsx`, `panels.tsx` | Status bar, grouped toolbar, full-width viewport with drawers for the component tree and properties, one transport bar, KPI strip and 13 panels. Properties include the component datasheet, design-check findings, BOM, live component swap, requirements, service, laser and camera parameters and layout override. |

`three`, `@react-three/fiber` and `@react-three/drei` load only with the 3D tab, in their own long-cached `three` vendor chunk (the 3D code itself is a ~290 kB chunk; the glTF exporter loads only when used). The canvas mounts after the page has painted, so the status, toolbar and panels appear first. If WebGL is unavailable, the tab shows the 2D engineering simulator instead (§82).

## Workspace

- **The machine comes first.** The viewport takes the full content width and most of the screen height. When the tab opens on a short screen, the page scrolls so the status, toolbar and viewport fit together. **Studio mode** (toolbar, or Esc to leave) turns the workbench into a full-window workspace.
- **Drawers instead of columns.** **Components** opens the tree over the left of the viewport. **Details** opens the properties over the right; selecting a component opens it automatically. Choosing a component in the tree frames it. Clicking in the viewport only selects.
- **One transport bar** under the viewport: run / pause, step to the next event, reset, the time scrubber and the playback speed. It is the only playback control.
- **Toolbar in labelled groups:**
  - **Explain:** guided tour, live narration.
  - **View:** fit, front, top, side, isometric, orthographic, camera mode.
  - **Inspect:** section, explode, X-ray, isolate, hide, show all, measure.
  - **Show:** name tags, design-check badges, layers, display and quality, overlay, enclosure, camera view.
  - **Export:** PNG, video of a cycle, view link, and the **3D model as glTF (.glb)** — engineering mode only.
- **Name tags: No tags / Working / All.** *Working* (the default) tags only the stations busy now, plus the selection and highlights. Measurement labels (FOV, field, zones) are a separate Display setting.
- **Design-check badges.** A component with an open finding carries a red or amber warning badge in 3D and a warning icon in the tree, and its findings are listed at the top of its properties. The Design check panel orders engineering physics before commercial findings. Repeated single-source findings collapse into one expandable row.
- **Status bar.** It adds the bottleneck. *UPH* reads *warming up* until the first minute of the run. A single line explains a sequence preview, and the performance-mode notice is a small icon.
- **Phones** get a simple viewer: essential tools only, no name tags or gizmo by default, and full-width drawers.

## Simulation depth

- **Inline part transfer.** Distance ÷ speed, with acceleration ramps when an acceleration is entered. The time is added to every station except the last (a station is occupied until its part has left), and the lineage shows distance, speed and source. The assembly cell and the test line use a DEMO 200 mm transfer at the PCB conveyor's stated 150 mm/s. The robot cell has no conveyor selected, so its transfer is *not included*, and the Studio says so.
- **S-curve and settling.** A jerk limit gives a jerk-limited profile (time = s/v + v/a + a/j for a full profile). A settling time is added after every move of that axis. Both are entered in the Motion panel. An axis without a settling time does not include one, and the scenario says so.
- **Robot type from the record.** A robot stating 5 or more axes is drawn and moved as an articulated arm: base yaw, shoulder, elbow, wrist keeping the tool vertical. Otherwise it is a SCARA. The robot transfer demo uses a DEMO 6-axis RB-A7.
- **Gripper sweeps.** The gripper envelope, plus the carried part, is checked along the whole pick-and-place path against fixed tooling. The simulation pauses at a hit, as it does for axis moves. The arm links are not included (a conceptual TCP envelope, not a reach study).
- **Part tracing.** On inline lines, click a part in 3D (or pick it in **Part trace**). The camera follows it, and the panel lists its events from the run, with *Go to* for each. A part the run rejects is ringed red at the station that rejects it.
- **Camera's-eye view.** **Camera view** renders the scene from the lens position with the FOV computed from the camera and lens records, as an inset. It shows what the camera frames, not a simulated image (no exposure, lighting or distortion).
- **Utilities.** Stated power and live power (components at working stations), energy per part as stated power × working time, and extraction airflow. Values come from the records only. Missing values are listed and compressed air is *Not Available*.

## Build from components (the machine architect)

A template fixes the stations. In **Build from components** mode (3D machine → **Builder** panel, the Studio's *Build from components* button, or the Copilot's *Build a 3D machine from the picked components*) the stations are **derived from the components**, and any change rebuilds the machine — the 3D view, the simulation, the BOM and the PLC steps follow because they all read the same scenario.

| Components | The architect decides |
|---|---|
| Laser source + galvo scanner (+ f-theta, expander, controller) | Scanned laser station; one parallel head per laser source (scanners and lenses are counted per head) |
| Laser source + processing head (+ linear stage / servo) | Head-and-axis (gantry) laser station; a missing axis is a stated gap |
| Laser source without delivery, or delivery without a source | Station with open slots and a stated gap |
| One camera | Alignment when the process needs the part position (welding, soldering, drilling, dicing, scribing, micromachining, trimming), otherwise inline inspection; the other use is suggested |
| Two or more cameras | Alignment + inspection; telecentric lenses and lighting go to inspection first |
| Inspection on a machine that is not manual | OK / NG sorting |
| Conveyor | Inline infeed / outfeed; automation inferred as *Inline* |
| Robot (+ gripper) | Robot loading, or the process station itself for Assembly / Handling / Packaging |
| No robot or conveyor | Operator load / unload (semi-automatic, stated as an assumption); fully automatic without handling hardware is a stated gap |
| Fixture, cylinders, vacuum, rotary stage | Fixture station; a laser process without a fixture is a stated gap |
| PLC, HMI, safety, power, enclosure … | Machine level (matching the Studio's machine slots) |
| Operator loading next to a laser | Light curtain / scanner acknowledged, or a stated safety gap |

The process comes from the builder, else the linked application, else the template, else the scenario's own process station name — and is shown with that basis. The rules are engineering heuristics, **not a language model**: the same components always give the same machine, every decision is listed with its reason, and nothing is invented — station times stay empty until entered, and times already entered survive a rebuild. Parts the architecture cannot use (scanner optics after a switch to a welding head, lenses without a camera, a gripper without a robot) are named, not hidden.

**Datasheet sizes.** A component whose datasheet states *dimensions* (L × W × H) is drawn at that size — laser source, chiller, fume extraction, camera and processing head — so a larger source or chiller changes the machine. Properties say whether a size is from the datasheet or a placeholder.

**Workpieces.** Besides PCB, plate, battery tab / can, wafer and metal part, the twin draws a sheet, a round tube, an electrode foil web and a glass panel. Without an entered workpiece the shape is picked from the scenario name and its size is shown as a placeholder.

**Utilization heat map.** Overlay → *Utilization heat map (run)* colours every station by its share of busy time over the whole run (single-hue scale) and lists busy / blocked / starved / down per station. It is not available for a sequence preview.

## Sharing and export

- **Copy view link**: the URL carries the camera, time, selection and camera view (`?cam=…&t=…&sel=…&pov=…`). Opening it restores them.
- **Export 3D model (glTF .glb)**: one node per machine object, named `<object> [<id>]` with its kind, layer, station and component id, so a CAD or review tool can map it back. The file's metadata says *CONCEPTUAL 3D MODEL — not manufacturing geometry*. Helpers (grid, labels, beams, parts in flow) are left out. Engineering mode only.
- **Record a cycle**: a WebM video of one representative cycle at the current playback speed (at most 60 s), made in the browser. Nothing is uploaded.
- **Performance**: frames, tables, cabinets, bridges and other components with no moving parts are merged into one mesh per material after they mount. This cuts draw calls without changing picking or selection.

## Detailed machine and live mechanisms

| Area | What is modelled |
|---|---|
| Base cabinet | Black aluminium profile skeleton, RAL 7035 panels, lockable front doors with handles and hinges, louvres, rear gland plate, levelling feet |
| Class-1 enclosure | Profile frame, sheet-metal back and sides, laser-protective windows (tinted by wavelength class), roof with extraction flange and LED strip (brighter while a part is inside), laser warning label, vertical-lift door with window, handle, seal and guide rails |
| Enclosure modes | **Closed** (customer view), **Cutaway** (right side and half roof removed, galvo housing see-through; engineering default) and **Frame only** |
| Motion | Stages with profile rails, ball screw, end blocks, slot cover and scale; servo motors with flange, body, encoder cap and connector; an **animated cable carrier** that follows the X carriage |
| Fixture | Plate, nest, locating pins, two pneumatic toggle clamps that **close during the clamp step and open at unload**, and a part-present sensor |
| Laser chain | Fibre laser module (front panel, handles, status LEDs, emission lamp lit while marking, fibre outlet), armoured **delivery fibre** routed to the collimator/isolator, focus (Z) slide with handwheel, beam expander, galvo head with **mirrors that follow the scan path**, f-theta barrel with rings and protective window, and an extraction nozzle with its **hose** to the fume unit |
| Vision | Camera body with fins and connectors, lens barrels with focus and aperture rings, LED ring lights that light up on trigger |
| Controls | Cabinet with plinth, door, main switch, filter fans, warning label, mounting plate, DIN rails and ducts. PLC, safety controller, drives, power supply and IPC are drawn as typed modules. The swing-arm HMI's screen is a **live canvas** showing state, counters, current step, recipe and alarms. E-stop and signal tower are included |
| Pneumatics | Filter-regulator service unit and valve terminal, with a tube to the clamps |
| Operator | Conceptual figure, hidden by default (tree eye icon); position only |

Performance mode drops small details automatically (LOD). Labels are de-cluttered by priority, and a label that would overlap another is nudged or hidden.

## Every machine type

The generator builds a working machine for **all 35 equipment templates** and every DEMO scenario, not only laser markers. Each station kind gets its own mechanism, driven by the station's live server state:

| Station kind | Mechanism in 3D | What moves |
|---|---|---|
| Load / unload (inline) | Infeed and outfeed magazines, an operator bench for manual stations, and a robot or gantry when one is selected | The infeed stack indexes a part out, and the outfeed stack grows with the run's good parts |
| Transfer | SCARA robot (selected robot, or a placeholder when none is selected) or a pick-and-place gantry | Inverse kinematics follows the pick → place path, and the part travels in the gripper |
| Assembly | Robot and component tray, or a tool bridge with a press ram, screwdriver spindle or dispense valve | The robot places a component onto the part, or the tool lowers, works and retracts |
| Process | Process bridge with a dispense, dicing, print, bond or packing head | The tool strokes and traverses; a saw blade spins |
| Test | Test press frame with a contact-probe head | The head descends, holds while the tester runs, then retracts |
| Laser (galvo) | Source, fibre, collimator, expander, galvo and f-theta | The mirrors follow the scan path |
| Laser (head) | Head gantry and processing head for welding, cutting and scribing (no galvo) | The head follows the seam |
| Vision / inspect / align | Camera, lens, ring light and bracket; the FOV is computed | The light turns on when triggered |
| Sort | NG diverter (pneumatic pusher) and OK / NG bins | The pusher fires **only for parts the run rejects at that station**, pushing them off the belt into the NG bin. PASS parts ride through |

- **Parallel stations** (inline lines): each parallel server gets its own lane, nest and head, driven by that server's state. The conveyor widens and shows lane guides.
- **Queues**: parts waiting for a station line up on the belt in front of it, one part pitch apart.
- **Rejects** are traced to the station that rejected them. The event log reads *Part 12 rejected at OK / NG diverter — FAIL (NG)*.
- **Bottleneck**: a dashed amber outline on the table around the station. The machinery keeps its own colours.
- **Narration** is station-aware. Examples: *Functional test: contact probes are made and the tester runs the test program (2 parallel nests…)*, *SCARA pick & place: robot lowers and releases — placing a component onto the part*, *…a part the run rejects is pushed off the belt by the pneumatic diverter*.
- **Overlays** only offer what the machine has. Laser-beam controls and scan paths appear only on laser machines, and the camera FOV only on machines with vision.

### DEMO scenarios

| Scenario | Machine | Shows |
|---|---|---|
| `sim-demo-laser-marker` | Semi-automatic laser marking machine (flagship, `#/3d`) | X/Y axes, galvo marking, alignment and inspection cameras, Class-1 enclosure and door |
| `sim-demo-battery-tab` | Battery tab laser welder | Head-mode laser: the gantry moves the welding head along the seam |
| `sim-demo-pcb-a/b/c`, `sim-demo-semi-marking` | Inline laser marking lines | Conveyors, parallel lasers, sort. `semi-marking` is incomplete on purpose, so it runs as a preview |
| `sim-demo-assembly-cell` | Electronics assembly cell | SCARA robot placing a connector from a tray |
| `sim-demo-test-line` | Functional test line | Two parallel test nests, NG diverter, buffer |
| `sim-demo-robot-transfer` | Robot pick-and-place transfer | The robot carries the part itself |

A new machine from any template opens straight in 3D (**Create and open in 3D** in the Studio). It runs as a labelled **SEQUENCE PREVIEW — not a result** until you enter its station times in the **Simulation inputs** tab.

## Explanations

- **Per component** (Properties → explanation card; `src/services/twin/explain.ts`):
  - *What it is* and *How it works* — a general description of the component type.
  - **In this machine** — sentences computed from the scenario's records. Examples: pulse energy from power ÷ repetition rate; beam size after the expander compared with the galvo aperture; estimated focused spot and depth of focus; field-width usage; camera µm per pixel; move distances and times.
  - Warnings, the component's role in the cycle with timing and basis, engineering checks, interfaces, maintenance and safety.
- **Guided tour** ("Explain machine"): 12 steps in process order — machine, safety, loading, motion, alignment, laser source, scan head, marking, inspection, unloading, controls and how the cycle time is built. Each step moves the camera and highlights the components involved; it can auto-advance.
- **Live narration**: while the simulation plays, a caption explains the current step with its duration and basis. Example: *Move to marking position: X +160 mm, Y +20 mm in 0.26 s — trapezoidal profile…*.

The explanations have already surfaced one real design finding in the DEMO data. The 7 mm source beam × the 1.5× expander gives 10.5 mm, which is larger than the SC-10 galvo's 10 mm aperture.

## What the flagship demo shows

The cycle runs: operator load and door close → pneumatic clamp → move to CCD positioning → alignment → move to marking position → laser enable and jumps → marking → move to post-CCD → code inspection → OK/NG → return and unload.

- **Axes**: X and Y come from the DEMO linear stage record `LS-500` (travel 500 mm, 1000 mm/s, 10 m/s²). Each move time is calculated.
- **Laser**: the beam runs from the fiber collimator through the beam expander, galvo and f-theta to the workpiece. The f-theta working distance (180 mm) comes from its specification and sets the head height. The marking field (110 × 110 mm) is checked against the requirement `TWIN-002` (40 × 20 mm).
- **Vision**: the FOV is computed from pixel size × resolution × WD ÷ focal length: 79 × 66 mm at 150 mm.
- **Everything is DEMO**: data is labelled DEMO and every assumption is listed in *Assumptions & export*.

## Honesty rules implemented

- No silent assumptions. An undefined axis speed, camera working distance or station time is reported as an input gap (§161, §162).
- The rendered beam colour is symbolic, and scan paths are symbolic. The cycle time comes from the station process inputs.
- Safety zones and the I/O list are conceptual aids. They are not certified safety validation or a PLC program.
- *Validated* simulation maturity is offered only when a PASS verification record is linked to the scenario (§133).
- Customer mode hides cost, supplier identities, the I/O, motion and assumption panels, and internal risk (§56).

## Component datasheets

`/component-datasheets` lists every component the platform holds: item master, engineering database, laser source classes, f-theta objectives and automation modules. Each one gets a **technical specification** and **supplier** sheet (`src/services/eng/componentDetail.ts`):

- Specification text is parsed into typed rows, and each row keeps the exact token it came from.
- Key specifications that are not stated show as **Not Available**.
- Vendors link to supplier and company records. Unknown supplier facts stay UNKNOWN.
- A vendor whose category does not fit the component is flagged for Procurement review.
