---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 26
part_title: "Part 20 — Machine software architecture"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 20 — Machine software architecture

Machine software is a state machine inside a mode manager. Modes decide who is in control (Auto, Manual, Maintenance, Setup); states decide where the cycle is. Design the fault, recovery, retry and abort paths with the same care as the good path — on a machine running at 92% availability, the recovery path is exercised hundreds of times a month.

### 20.1 Objective

Define the software architecture — modes, states, transitions, fault handling, recovery, part tracking and interfaces — before coding, so behaviour is predictable, testable at FAT, and consistent across machines.

### 20.2 Engineering concept

*Figure 8. State machine · 10 cycle states, fault, recovery and abort paths* — [Figure not transcribed; see source document]

The normal cycle runs INIT → HOME → IDLE → LOAD → CLAMP → ALIGN → PROCESS → INSPECT → UNLOAD → COMPLETE and loops back to LOAD for the next part (or to IDLE on a cycle-stop request). Any running state can fall into FAULT; from there the operator either recovers (resume at the last confirmed step) or aborts (the part is flagged NOK, unloaded, and the machine returns to IDLE).

For line integration, the ISA-TR88 (PackML) state model offers a standard set of states (Stopped, Idle, Execute, Held, Suspended, Aborted and others) and unit modes (Production, Maintenance, Manual). Map the machine's internal states onto PackML when the customer's line controller or MES expects it.

### 20.3 Architecture — state definitions

| State | Entry actions | Exit condition (next state) | Timeout / fault behaviour |
|---|---|---|---|
| INIT | Check safety OK, air OK, communication OK, recipe loaded | All checks pass (HOME) | Missing condition shown as a named permissive |
| HOME | Reference axes in a safe order; retract cylinders | All devices at home (IDLE) | Homing timeout per axis → FAULT |
| IDLE | Wait for start and permissives | Start pressed or MES job received (LOAD) | — |
| LOAD | Accept part; read ID; select recipe | Part seated and identified (CLAMP) | No-read → operator verification (Part 3) |
| CLAMP | Close clamps | Clamped on part confirmed (ALIGN) | Clamp timeout → FAULT |
| ALIGN | Move to process position; vision alignment if used | In position, offsets valid (PROCESS) | Vision retry up to 2 → reject |
| PROCESS | Run the process with recipe parameters; log data | Process complete signal (INSPECT) | Process fault → FAULT, part flagged |
| INSPECT | Verify CTQs | Verdict available (UNLOAD) | Inspection retry up to 1 → NOK |
| UNLOAD | Unclamp; route good or reject | Part removed and confirmed at destination (COMPLETE) | Diverter not confirmed → FAULT |
| COMPLETE | Write record to MES; update counters | Record acknowledged or buffered (LOAD or IDLE) | MES offline → buffer and warn |
| FAULT | Stop per alarm class; keep part-tracking data | Operator reset and choice (RECOVER or ABORT) | — |
| RECOVER | Drive devices back to the last confirmed step's entry state | Entry conditions met (resume that step) | Recovery timeout → FAULT |
| ABORT | Flag part NOK; unload to quarantine | Part confirmed out (IDLE) | — |

### 20.4 Components

| Software component | Responsibility |
|---|---|
| Mode manager | Allowed operations, speeds and safety conditions per mode |
| State manager | Machine state, transitions, cycle-stop and immediate-stop handling |
| Module sequences | One state machine per module, coordinated by the state manager |
| Device layer | Cylinders, axes, sensors, vacuum, laser interface with timeouts and alarms (Part 19) |
| Alarm manager | Classes, first-out, history, remedy texts |
| Recipe manager | Recipe storage, validation, version, variant selection |
| Part tracker | Where each part is, its ID, status, process data, and NOK flags — survives faults and power loss |
| Data logger and MES interface | Records, buffering, acknowledgement (Part 23) |
| HMI interface | Status, commands, permissive display (Part 21) |
| Safety status interface | Reads safety PLC states; never writes safety decisions |

### 20.5 Design methodology

- Derive states from the process flow (Part 3), including every exception path.
- Write the state table: entry actions, exit conditions, timeouts, fault behaviour.
- Define the mode matrix (below) with the risk assessment.
- Define fault classes and reactions; define retry limits for each retryable operation.
- Define recovery: for each step, the entry conditions and how to restore them.
- Define part tracking and what happens to part data on fault, abort and power loss.
- Code the state manager first, then module sequences, then devices.
- Test every transition, including faults injected at each state, before FAT (Part 38).
Mode matrix

| Capability | Auto | Manual | Maintenance | Setup (engineer) |
|---|---|---|---|---|
| Automatic sequence | Yes | No | No | No |
| Single device commands (jog, cylinder toggle) | No | Yes, with interlocks | Yes, with interlocks | Yes |
| Guards | Closed and locked | Closed | May open under hold-to-run, enabling device, safely limited speed per risk assessment | As risk assessment |
| Laser emission | Yes, Class 1 | Test firing only with doors closed | Alignment beam or reduced power under controlled access | As maintenance |
| Recipe and parameter edit | No | No | No | Yes, logged |
| Access level | Operator | Technician | Technician with key or badge | Engineer |

### 20.6 Calculations

CT_(eff)=CT+∑_k^​ p_k t_(retry,k)

MTTR=t_(detect)+t_(diagnose)+t_(repair)+t_(recover)+t_(restart)

p_k = probability that operation k needs a retry; t_retry,k = time of one retry. Example: vision retry probability 2% at 1.2 s adds 0.024 s per cycle — negligible. Recovery time is often the largest slice of MTTR: a machine whose recovery requires a full re-home (90 s) and manual unload (120 s) turns every 10-second jam into a 4-minute stop. Designing "resume at last confirmed step" cuts that to under 30 s.

### 20.7 Industrial example — fault at PROCESS on the marking cell

- Laser source reports an interlock fault mid-mark. Alarm class: stop immediately.
- State manager enters FAULT; shuttle and laser stop; part tracker records part ID, recipe, partial-mark flag.
- HMI shows the first-out alarm with remedy text: "Laser interlock opened — check enclosure door switch S21."
- Technician closes the door, resets. Operator is offered RECOVER or ABORT.
- Recipe rule for marking: a partially marked part cannot be re-marked safely (overlaid code), so RECOVER is disabled for this step; ABORT flags the part NOK, unloads it to the quarantine chute, and returns to IDLE.
- MES receives a record with status NOK-ABORTED and the alarm ID, so genealogy stays complete.

### 20.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Custom state model vs PackML | Tailored, simple | Standard for line integration and OEE reporting | PackML when the customer's line or MES requires it; internal states can remain custom beneath it |
| Central state machine vs per-module state machines | Simple for small machines | Scales to many stations, reusable modules | Per-module with a coordinating state manager for anything beyond one station |
| Resume vs restart after fault | Fast recovery, complex logic | Simple logic, long recovery | Resume where the process allows; restart where partial processing is unsafe |
| SFC vs ST CASE statement | Visual, easy for technicians | Compact, versionable | Either, consistently; show the active step on the HMI either way |

### 20.9 Common mistakes

- Only the good path is designed; faults are handled "by reset".
- Part data lost on a fault, so the MES never learns what happened to a serial.
- Maintenance mode that bypasses interlocks instead of applying the safety measures the risk assessment requires.
- Retry loops without limits.
- Recovery that silently re-processes a part that was already processed.

### 20.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Machine stuck, no alarm | Transition condition never true, no timeout | Online view of active state and permissives | Which condition is false | Add timeout and permissive display | Every state has a timeout |
| Duplicate or missing MES records | Part tracker not persistent, COMPLETE re-entered | Compare part tracker log with MES | Record count vs parts | Persist tracker; idempotent record IDs | Test power-loss mid-cycle at FAT |
| Long recovery after minor jams | Recovery requires full home | Time the recovery path | Seconds to resume | Step-wise recovery | Recovery design per state |
| Unsafe motion after reset | Devices resume without confirmation | Review reset logic | Sequence after reset | Require operator start after reset | Reset is never a start |

### 20.11 Design checklist

- State table complete with entry actions, exit conditions, timeouts and fault behaviour
- Mode matrix agreed with the safety engineer
- Fault classes, retry limits, recovery and abort rules defined per state
- Part tracking survives faults and power loss; MES records are idempotent
- Reset never restarts motion; start is a separate operator action
- Active state and permissives visible on the HMI
- PackML mapping defined if the line requires it
- Fault injection at every state included in the FAT protocol

### 20.12 Key takeaways

- Modes decide who is in control; states decide where the cycle is.
- Design fault, retry, recovery and abort paths as carefully as the good path.
- Part tracking must survive faults, aborts and power loss.
- Fast recovery is the cheapest availability improvement available.
