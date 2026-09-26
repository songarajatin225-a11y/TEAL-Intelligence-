---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 13
part_title: "Part XII — Automation and Vision"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XII — Automation and Vision

In production, the laser is one station in a line: vision tells it where the part really is, the PLC tells it when, the MES tells it what, and inspection proves it worked. Most field failures of laser cells are integration failures — wrong offsets, lost handshakes, missing data — not laser failures.

## 12.1 Vision system building blocks

| Element | Options | Selection notes |
|---|---|---|
| Sensor | CMOS (dominant: global shutter, high frame rate); CCD (legacy, very uniform) | Global shutter for moving parts; pixel size vs optics resolution |
| Format | Area scan; line scan | Line scan for webs, wafers, long or rotating parts |
| Resolution | FOV ÷ pixels = µm per pixel | 5 MP (2448 × 2048) over 20 mm ≈ 8 µm/pixel; features ≥ 3–4 pixels; edge location to ~0.1 pixel |
| Lens | Fixed focal, macro, telecentric, through-the-lens (TTL via scanner) | Telecentric for measurement (constant magnification with depth); TTL needs chromatic and distortion calibration |
| Coaxial illumination | Diffuse on-axis light | Specular metal parts, DataMatrix on polished surfaces |
| Ring light | Bright-field or low-angle dark-field | Engraved and dot-style marks, edges |
| Dome / backlight / structured light | Diffuse, silhouette, 3D | Curved shiny parts; outlines; weld bead and height profiles |
| Functions | Pattern matching, fiducial alignment, OCR/OCV, barcode and DataMatrix reading and grading, position correction, inspection (presence, dimension, defects, AOI), 3D profiling | Grading per ISO/IEC 29158 (DPM) or ISO/IEC 15415 |

Calibration links three coordinate systems — camera, scanner and machine. A grid is marked across the field, imaged, and used to compute the camera-to-scanner transform and distortion map; robots need hand–eye calibration. Recalibrate after any change of lens, scanner, camera or mounting.

## 12.2 The vision-guided processing loop

Position correction is applied to the job coordinates before processing; inspection closes the loop and gates part release.

## 12.3 Integration with automation

| Element | Role with the laser | Integration notes |
|---|---|---|
| PLC | Cell master: sequence, handshakes, interlocks | Hard-wired emission interlocks; fieldbus for data |
| Six-axis robot | Carries the head (welding, cutting, cleaning) or presents parts | Path accuracy vs repeatability; on-the-fly scanner welding needs robot–scanner synchronisation |
| SCARA | Fast planar handling; carries small soldering or marking heads | ±10–20 µm repeatability |
| Gantry | Large work areas, multi-head processing | Thermal growth compensation |
| Conveyor | In-line flow (PCB, pallets, packaging) | SMEMA / IPC-HERMES-9852 handshakes in electronics |
| AGV / AMR | Material logistics between cells | Docking accuracy, fleet manager interface |
| MES | Orders, recipes, genealogy, quality records | OPC UA, MQTT, IPC-CFX (electronics), SECS/GEM (semiconductor) |
| SCADA | Line-level supervision and alarms | Tag mapping, historian |
| Industry 4.0 | Connected, data-driven operation | Condition monitoring, predictive maintenance, digital twins (→ §25.4) |

## 12.4 Handshake: a typical in-line marking cycle

| Signal | Direction | Meaning |
|---|---|---|
| Ready | Laser → PLC | Source and controller ready, no alarms |
| Start | PLC → Laser | Execute the loaded job |
| Busy | Laser → PLC | Job running |
| Done / End | Laser → PLC | Job completed |
| Error / Alarm | Laser → PLC | Fault code available |
| Emission enable | Safety → Laser | Hard-wired permission to emit |
| Shutter open / closed | Both | Monitored safety shutter status |
| Job / recipe select | PLC → Laser | Job number or name, variable data |

## 12.5 Recipes, interlocks, data logging, traceability and SPC

| Topic | Good practice |
|---|---|
| Recipes | One validated, versioned parameter set per product, joint or mark; locked after validation; changes through change control |
| Process interlocks | No emission unless gas pressure, chiller, fume extraction, window condition and part presence are all OK |
| Quality interlocks | No release without a readable, graded code or a passing process signature |
| Data logging | Per part: ID, timestamp, recipe version, measured power, process signals, inspection result |
| Traceability | Genealogy links the part to materials, machine, recipe, operator and results; the laser-marked ID is the key |
| Process monitoring | Photodiode, OCT, pyrometer or camera signals compared against learned envelopes |
| SPC | Control charts on key characteristics (code grade, penetration signal, measured power); capability targets typically Cpk ≥ 1.33, higher (≥ 1.67) for critical automotive characteristics |
