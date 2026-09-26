---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 27
part_title: "Part 21 — HMI design"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 21 — HMI design

An HMI exists to answer three operator questions in under five seconds: is the machine running normally, if not why not, and what do I do now. Grey screens with colour reserved for abnormal states, a visible list of missing permissives, and alarms that say cause and remedy do more for availability than any animation.

### 21.1 Objective

Design the screen set, navigation, alarm presentation and access levels so operators, technicians and engineers can run, diagnose and change the machine safely and quickly.

### 21.2 Engineering concept

Good HMI practice follows the high-performance HMI approach of ISA-101: neutral backgrounds, colour only for abnormal conditions, trends and analogue indicators instead of raw numbers, and a screen hierarchy from overview to detail. Alarm management follows ISA-18.2 / IEC 62682: every alarm needs a defined response, and alarm floods are a design defect.

| Hierarchy level | Purpose | Example |
|---|---|---|
| 1 — Overview | Whole machine at a glance | Home screen: state, mode, OEE, active alarm, part counts |
| 2 — Module | One module's operation | Shuttle and laser station status, permissives |
| 3 — Detail | Device-level control and data | Axis screen, cylinder status, laser parameters |
| 4 — Diagnostics | Troubleshooting | I/O monitor, fieldbus status, event log |

### 21.3 Architecture — the screen set

| Screen | Content | Access |
|---|---|---|
| Home | Machine state and mode, active alarm (first-out), counts, OEE, current recipe, start/stop status | All |
| Auto | Cycle view, active step per module, missing permissives, cycle time vs target | Operator |
| Manual | Device commands grouped by module, each with its interlock status | Technician |
| Recipe | Select, view, edit (engineer), compare versions, validate ranges | View: operator; edit: engineer |
| Alarm | Active and historical alarms, class, time, cause, remedy, acknowledge | All; reset by level |
| Maintenance | Counters (cycles, laser hours, filter hours), PM due list, calibration routines | Technician |
| Diagnostics | Network status, device diagnostics (IO-Link, drives), event log | Technician |
| I/O | Live input and output states with tags and descriptions; forcing only with engineer access and logging | Technician (view), engineer (force) |
| Servo | Axis position, following error, torque, faults, jog, homing | Technician |
| Production | Shift counts, good/NOK, downtime reasons, OEE breakdown | Operator, supervisor |
| Traceability | Last N parts: ID, recipe, parameters, verdict, MES status | Operator, quality |
| Users and settings | Login, user levels, language, time sync status | Administrator |

### 21.4 Components

| Item | Specification points |
|---|---|
| Panel hardware | Size (12–15 inch typical for SPMs), touch type (projected capacitive works with thin gloves), brightness, IP rating front |
| Physical controls | Start, stop, reset, E-stop, mode selector or enabling device, stack light, buzzer |
| Software | HMI runtime or web HMI, alarm server, recipe database, user management, audit trail |
| Languages | English plus the operators' language where needed; all texts from a translatable text list |

### 21.5 Design methodology and principles

- Define user roles and tasks; write the top ten tasks per role.
- Design navigation: every screen reachable from Home in ≤ 2 touches; fixed navigation bar.
- Build a style guide: neutral grey backgrounds; colour for abnormal only (red alarm, amber warning, blue for operator attention); never colour alone — add shape or text.
- Show state, mode and first-out alarm on every screen.
- Show missing permissives in plain words ("Door D2 open") wherever a start or move command can be refused.
- Write alarm texts as: what happened → probable cause → what to do.
- Use analogue indicators with limits and trends for process values instead of bare numbers.
- Confirm destructive actions (delete recipe, reset counters) and log them with user and time.
- Test with real operators before FAT: time them on the top tasks.

### 21.6 Calculations

h_(text)≈0.0064⋅D_(view)

R_(alarm)=(N_(alarms))/(t_(shift))

s_(touch)≥10–15 mm

h_text = minimum character height for comfortable reading (≈ 22 arc-minutes of visual angle) at viewing distance D_view: 6.4 mm at 1 m. R_alarm = alarm rate per shift; a machine that raises more than a few alarms per hour in normal running has an alarm design problem, not an operator problem. Touch targets of at least 10 mm, 15 mm with gloves.

### 21.7 Industrial example — marking cell HMI decisions

- Home screen shows a single line of truth: "AUTO — RUNNING — 5.3 s — Recipe HSG-A — 0 alarms".
- When Start is refused, the Auto screen lists permissives in plain words: "Waiting: operator light curtain clear; fume filter Δp high (warning)".
- Alarm text example: "A-231 Clamp 1 not confirmed within 1.0 s — part not seated or sensor B102 misadjusted — remove part, check seating on pads, check B102 LED."
- Traceability screen shows the last 50 parts with code grade and MES acknowledgement, so quality can answer a question without the MES team.
- Maintenance screen counts laser-on hours, protective-window changes and filter hours against PM intervals from Part 42.

### 21.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Rich graphics vs high-performance style | Attractive in sales demos | Faster abnormal-state detection | High-performance style for production; a separate showcase screen for demos if wanted |
| Local panel vs web HMI | Robust, no IT dependency | Access from tablets and offices | Local panel for control; web for viewing, with security controls |
| Many alarms vs few | Everything visible | Operators respond to what matters | Alarm only when an operator action is needed; log the rest as events |

### 21.9 Common mistakes

- Green-everywhere screens where red is the only difference between normal and fault.
- Alarm texts like "Error 17".
- No indication why Start does nothing.
- Engineering parameters reachable by operators.
- Different navigation on every machine from the same builder.

### 21.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Operators ignore alarms | Alarm flood, nuisance alarms | Alarm frequency analysis over a week | Top 10 alarms by count | Fix causes, demote to events, add delays | Alarm rationalization before FAT |
| Frequent wrong-recipe production | Manual recipe selection | Compare recipe vs part ID logs | Mismatch rate | Recipe from part ID or MES | Auto-selection in FRS |
| "Machine won't start" calls | Permissives not shown | Observe operator at start | Time to diagnose | Permissive display | Permissive list in HMI spec |
| Slow screen changes | Too many tags polled, heavy graphics | HMI performance monitor | Update time | Reduce polling, simplify | Performance test at integration |

### 21.11 Design checklist

- Roles, top tasks and access levels defined
- Style guide: neutral background, colour for abnormal, redundant coding
- State, mode and first-out alarm on every screen
- Permissives shown wherever a command can be refused
- Every alarm has class, cause and remedy text
- Recipe edits and forces logged with user and time
- Text height and touch targets checked for viewing distance and gloves
- Usability test with operators before FAT

### 21.12 Key takeaways

- Answer "is it normal, why not, what now" in under five seconds.
- Colour is for abnormal; grey is for normal.
- Show permissives and write alarms as cause plus remedy.
- One navigation style across all machines from the same builder.
