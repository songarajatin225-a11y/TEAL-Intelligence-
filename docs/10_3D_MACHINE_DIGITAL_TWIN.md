# 10 — 3D Machine Simulator + Digital Twin Studio

The 3D machine simulator is part of the **Equipment Simulation Studio**, not a separate app. Every simulation scenario has a **3D machine** tab (`/studio/:id?tab=machine3d`). The flagship demo is the **semi-automatic laser marking machine** (`sim-demo-laser-marker`, shortcut `#/3d`).

> **3D conceptual digital twin**: an engineering simulation model, not a CAD manufacturing release. The first release covers **3D engineering, kinematics, sequence and material flow**. It is not CAD, CFD, FEA, optical ray tracing, certified safety simulation, a PLC runtime or a factory-validated physics model.

## Architecture

| Layer | File | What it does |
|---|---|---|
| Twin inputs (schema) | `src/domain/engineering.ts` → `Simulation.twin` | Holds only what the model needs beyond the stations: workpiece, process area, axes, per-part moves, camera working distance, layout overrides, zones, snapshots, recorded runs and factory placement. |
| Motion engine | `src/services/twin/motion.ts` | Axis model (§17). Travel, speed and acceleration come from the linked stage record unless you enter them. Moves use a trapezoidal or triangular profile (§18). |
| Canonical cycle | `src/services/sim/model.ts` (`addMotion`) | Axis move time is **calculated** and added to the station time. The 3D cycle is therefore the simulated cycle (§69). A missing axis speed blocks the run with an input gap and is never assumed. |
| Machine generator | `src/services/twin/machine.ts` | Builds the conceptual scene graph from stations and selected components (§8–§13, §118–§120). Every object carries `partId`, `stationKey`, layer and BOM level, and links to its BOM line. It also computes camera FOV (§31), laser beam path and field, safety zones, cable routes and the conceptual I/O list. |
| Collision | `src/services/twin/collision.ts` | Axis-aligned bounding boxes, sampled along every planned move (§20). Exposes the `PhysicsProvider` interface: bounding-box collision is active; rigid-body, robotics, optical and thermal/FEA are future extension points. |
| Sequence + central state | `src/services/twin/timeline.ts` | `TwinPlayer` wraps **one** seeded DES run (`services/sim/des`). Its `at(t)` is the single `SimulationState` read by the scene, event log, KPIs, HMI, alarms and I/O (§45, §46). Station time is split into sub-steps only where the data allows (axis moves, entered laser jump overhead); the remainder keeps the station's basis. |
| Design check | `src/services/twin/checks.ts` | Rules for f-theta field vs process area, camera FOV vs target, axis travel, collisions, throughput vs target, footprint and enclosure. It reuses the Studio design review (§114, §178). |
| Process paths | `src/services/twin/process.ts` | Symbolic marking, welding, cutting, cleaning, drilling and scribing paths inside the process area. Visual only; they are never used for cycle time. |
| 3D library | `src/features/twin/three/procedural.tsx` | Parametric procedural components registered by generator key (§119, §120) and the restrained industrial material set (§121). |
| Scene | `src/features/twin/three/MachineScene.tsx` | React Three Fiber scene. Covers views, orthographic/perspective, section, explode, X-ray, layers, overlays, measure, beam and scan, FOV, zones, dimensions, comparison ghost, factory boxes, performance monitor, debug stats and screen-space labels. |
| Workbench | `src/features/twin/MachineTab.tsx`, `panels.tsx` | Header status, toolbar, component tree, properties (component datasheet, BOM, live component swap, requirements, service, laser and camera parameters, layout override), KPI bar and ten panels. |

`three`, `@react-three/fiber` and `@react-three/drei` load only with the 3D tab, in a separate lazy chunk. If WebGL is unavailable, the tab shows the 2D engineering simulator instead (§82).

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
