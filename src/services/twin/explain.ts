import * as L from '../../calculations/laser';
import { fmtNum } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import type { CycleResult } from '../sim/capacity';
import type { Resolved } from '../sim/model';
import type { Machine3DObject, MachineModel } from './machine';
import { specIn } from './motion';
import type { SubStep } from './timeline';

/*
 * ENGINEERING EXPLANATIONS for the 3D digital twin (3D master prompt §83, §139, §153, §164).
 *
 * Two kinds of content, kept visibly apart:
 *  - GUIDE text: general engineering knowledge about a component type (what it is, how it works,
 *    what to check, how to look after it). It describes the technology, never a specific product.
 *  - "In this machine": sentences computed from THIS scenario's records — selected parts, stated
 *    specifications, station times, calculated moves and optics estimates. A value that is not in a
 *    record is reported as not stated; nothing is filled in.
 */

export interface Guide {
  title: string;
  what: string;
  how: string;
  checks: string[];
  interfaces: string[];
  care: string[];
  safety?: string;
}

const G: Record<string, Guide> = {
  frame: {
    title: 'Base frame',
    what: 'The structure that carries every module and gives the machine its stiffness, levelling and footprint. The lower bay holds the laser source, pneumatics and cable routing behind lockable service doors.',
    how: 'Aluminium-profile skeleton with sheet-metal panels on levelling feet. Stiffness matters because vibration of the table relative to the scan head shows up directly as mark position error.',
    checks: ['Stiffness / natural frequency against motion and floor vibration', 'Levelling and anchoring', 'Service access to the lower bay', 'Footprint against the customer layout'],
    interfaces: ['Mechanical: carries table, enclosure, motion system', 'Electrical: cable routing to the cabinet', 'Pneumatic: service unit and valve terminal'],
    care: ['Re-level after moving the machine', 'Check fastener torque at the scheduled PM'],
  },
  table: {
    title: 'Machine table',
    what: 'The flat reference plate the motion system is built on.',
    how: 'Granite or ground steel damps vibration and keeps the stage rails flat and parallel, which keeps the part at a constant height below the f-theta lens (inside its depth of focus).',
    checks: ['Flatness over the stage travel', 'Mounting pattern for rails and columns', 'Thermal stability'],
    interfaces: ['Mechanical: X-axis stage, columns, camera brackets'],
    care: ['Keep free of marking debris'],
  },
  enclosure: {
    title: 'Class-1 laser enclosure',
    what: 'Encloses the complete beam path so that no hazardous laser radiation can reach people during normal operation, and contains fumes.',
    how: 'Opaque sheet-metal walls and roof, a viewing window made of laser-protective filter material chosen for the laser wavelength (specified by optical density at that wavelength), and interlocked doors: opening a door removes laser enable through the safety controller.',
    checks: ['Window optical density at the laser wavelength', 'Interlock design (category / performance level from the risk assessment)', 'Extraction port and air flow', 'Service panels need tools or are interlocked'],
    interfaces: ['Safety: door interlock → safety controller → laser enable', 'Fume extraction duct', 'Lighting'],
    care: ['Inspect the viewing window for damage', 'Test the door interlock at every PM'],
    safety: 'Laser classification must be established by measurement and assessment against IEC 60825-1 — this model shows design intent only.',
  },
  door: {
    title: 'Interlocked loading door',
    what: 'The operator access opening for loading and unloading the part.',
    how: 'A vertical-lift door with a laser-protective window. A coded interlock switch reports "door closed"; the PLC will not start a cycle and the safety controller will not enable the laser while it is open.',
    checks: ['Opening size against the part and the operator reach', 'Interlock coding (anti-defeat)', 'Door speed / pinch points'],
    interfaces: ['Safety: interlock switch', 'Controls: door-closed input'],
    care: ['Clean the window', 'Check hinges / guides and the interlock actuator'],
  },
  door_switch: {
    title: 'Door interlock switch',
    what: 'Safety sensor that detects the door is closed.',
    how: 'A coded (e.g. RFID) actuator on the door must be present at the switch head; two channels go to the safety controller, which removes laser enable and stops motion if the door opens.',
    checks: ['Performance level of the safety function', 'Anti-tamper coding', 'Response time'],
    interfaces: ['Safety controller (dual channel)'],
    care: ['Function test at every PM'],
  },
  light_curtain: {
    title: 'Safety light curtain',
    what: 'Detects a hand or body entering a hazardous opening.',
    how: 'A row of infrared beams between a transmitter and receiver; any interruption switches its safety outputs off within its response time.',
    checks: ['Resolution (finger / hand)', 'Safety distance from response time and approach speed (ISO 13855)', 'Type (IEC 61496)'],
    interfaces: ['Safety controller'],
    care: ['Clean the windows', 'Test with the test rod'],
  },
  sensor: {
    title: 'Sensor',
    what: 'Tells the PLC about the state of the machine (part present, position reached, door closed …).',
    how: 'Photoelectric, inductive or reed sensors switch a 24 V digital input when their condition is met.',
    checks: ['Switching distance against the target', 'Response time', 'Mounting away from the beam and debris'],
    interfaces: ['PLC digital input'],
    care: ['Clean the sensing face', 'Check alignment'],
  },
  xy_stage: {
    title: 'Linear stage (X / Y axis)',
    what: 'Carries the fixture and part to each process position: loading, alignment camera, marking position, inspection.',
    how: 'A carriage on two profile rails is pushed by a ball screw turned by a servo motor. The motion controller commands point-to-point moves with an acceleration–cruise–deceleration (trapezoidal) profile; move time follows from distance, speed and acceleration.',
    checks: ['Travel ≥ the furthest target', 'Speed and acceleration (drive the move time)', 'Repeatability against the required mark position (vision correction relaxes this)', 'Payload (fixture + part + upper axis)'],
    interfaces: ['Mechanical: table (X), X-carriage (Y), fixture', 'Electrical: servo motor, limit / home sensors, cable carrier'],
    care: ['Lubricate the ball screw and rails', 'Keep covers / bellows closed against marking debris'],
  },
  servo_motor: {
    title: 'Servo motor',
    what: 'Turns the ball screw of an axis.',
    how: 'A permanent-magnet AC motor with an encoder; the servo drive closes current, velocity and position loops so the axis follows the commanded profile.',
    checks: ['Rated / peak torque against the load inertia and acceleration', 'Speed against screw lead × required linear speed', 'Encoder type (absolute avoids homing)'],
    interfaces: ['Servo drive (power + encoder cable)', 'Coupling to the ball screw'],
    care: ['Check the brake (vertical axes)', 'Inspect cables in the cable carrier'],
  },
  chain: {
    title: 'Cable carrier (drag chain)',
    what: 'Guides motor, encoder and sensor cables to the moving carriage.',
    how: 'Articulated links keep the cables at a defined minimum bend radius while the carriage travels, so the cables survive millions of cycles.',
    checks: ['Bend radius against the cable specifications', 'Fill level', 'Travel length'],
    interfaces: ['Moving carriage ↔ fixed frame'],
    care: ['Inspect for broken links and cable wear'],
  },
  fixture: {
    title: 'Fixture with pneumatic clamps',
    what: 'Holds the part in a known, repeatable position and flat, so the mark lands in the right place and in focus.',
    how: 'Locating pins / a nest define X, Y and rotation; pneumatic clamps press the part down. A reed switch confirms the clamp is closed before the cycle continues.',
    checks: ['Locating accuracy against part tolerance', 'Flatness of the marking surface against the depth of focus', 'Clamp force and clamp position clear of the marking area', 'Changeover time for part variants'],
    interfaces: ['Mechanical: Y carriage', 'Pneumatic: clamp valve', 'Controls: clamp and part-present sensors'],
    care: ['Clean marking debris from the nest', 'Check clamp pads'],
  },
  z_column: {
    title: 'Column / bracket',
    what: 'Rigid support that holds a tool (scan head or camera) at its working height.',
    how: 'Its height sets the working distance: for the scan head, the f-theta working distance; for a camera, the lens working distance.',
    checks: ['Stiffness (vibration of the head = mark jitter)', 'Height adjustment range for part variants'],
    interfaces: ['Table', 'Tool mounting plate'],
    care: ['Check locking after any height change'],
  },
  z_slide: {
    title: 'Focus (Z) slide',
    what: 'Sets the height of the scan head so the focal plane sits on the part surface.',
    how: 'A lockable slide or motorised axis on the column moves the head; the correct height is working distance + part surface height.',
    checks: ['Adjustment range against part heights', 'Repeatability of focus setting'],
    interfaces: ['Column', 'Scan head plate'],
    care: ['Re-check focus after changeover'],
  },
  collimator: {
    title: 'Fibre collimator / isolator',
    what: 'The output end of the laser delivery fibre.',
    how: 'Light leaving the fibre diverges; the collimator lens turns it into a parallel beam. Pulsed fibre lasers usually include an optical isolator here that blocks back-reflections from the part.',
    checks: ['Output beam diameter', 'Isolator power rating', 'Alignment to the scanner aperture'],
    interfaces: ['Delivery fibre from the laser source', 'Beam expander / scanner'],
    care: ['Never bend the fibre below its minimum radius', 'Keep the output window clean'],
  },
  beam_expander: {
    title: 'Beam expander',
    what: 'Enlarges the collimated beam before the scanner.',
    how: 'A small telescope (e.g. Galilean) multiplies the beam diameter by its magnification. A larger beam on the f-theta lens gives a smaller focused spot (d ≈ 4·M²·λ·f / (π·D)) — but the expanded beam must still fit through the galvo aperture.',
    checks: ['Expanded beam ≤ scanner aperture', 'Wavelength / coating range', 'Power rating'],
    interfaces: ['Collimator (input)', 'Galvo scanner (output)'],
    care: ['Keep optics clean and covered'],
  },
  galvo: {
    title: 'Galvanometer scan head',
    what: 'Steers the laser beam across the part at high speed.',
    how: 'Two galvanometer motors each rotate a lightweight mirror — the first deflects the beam in X, the second in Y. Closed-loop angle sensors let the mirrors reach commanded positions in fractions of a millisecond; the scanner controller streams positions synchronised with laser on/off. Marking speed and jump speed limit the process time.',
    checks: ['Aperture ≥ beam diameter', 'Wavelength / coating range', 'Marking and jump speed against the recipe', 'Repeatability and drift'],
    interfaces: ['Optical: beam expander → f-theta', 'Electrical: scanner controller (digital protocol, e.g. XY2-100)', 'Mechanical: head plate on the column'],
    care: ['Protect the mirrors from dust', 'Calibrate the field (distortion correction) after changes'],
  },
  f_theta: {
    title: 'F-theta scan lens',
    what: 'Focuses the scanned beam onto a flat field.',
    how: 'Unlike a normal lens, the spot position is (nearly) proportional to the mirror angle (image height ≈ f·θ), so a flat field is scanned uniformly. Focal length sets field size and spot size; working distance is the gap from the lens to the part. A protective window in front takes the spatter.',
    checks: ['Field size ≥ required marking area', 'Working distance fits the fixture and clamps', 'Entrance beam diameter', 'Wavelength and power rating'],
    interfaces: ['Galvo scanner (threaded mount)', 'Part surface at the working distance'],
    care: ['Replace the protective window when contaminated', 'Never clean with dry wipes'],
  },
  laser_head: {
    title: 'Processing head',
    what: 'Focuses a high-power beam for welding or cutting.',
    how: 'Collimating and focusing optics, a protective window and often a coaxial camera or process monitor.',
    checks: ['Power rating', 'Focal length / spot size', 'Cooling'],
    interfaces: ['Delivery fibre', 'Motion axis', 'Cooling'],
    care: ['Replace protective windows', 'Monitor cooling flow'],
  },
  fume: {
    title: 'Fume extraction unit',
    what: 'Removes the particles and gases produced when the laser removes or melts material.',
    how: 'A fan draws air through a nozzle next to the marking field and a hose to the unit, where pre-filter, HEPA filter and activated carbon capture particles and gases.',
    checks: ['Air flow at the nozzle', 'Filter efficiency for the material (metal dust, plastics fumes)', 'Filter saturation alarm → laser interlock'],
    interfaces: ['Nozzle / hose', 'Interlock input "extraction running"'],
    care: ['Change filters on the saturation alarm'],
    safety: 'Required for operator health and to keep the optics clean.',
  },
  nozzle: {
    title: 'Extraction nozzle',
    what: 'Captures fumes right where they are produced.',
    how: 'Placed beside the marking field, close to the surface but outside the beam and the part path.',
    checks: ['Distance to the marking field', 'Clearance to the moving part'],
    interfaces: ['Hose to the extraction unit'],
    care: ['Clean deposits'],
  },
  camera_align: {
    title: 'Alignment camera (CCD positioning)',
    what: 'Finds the actual position of the part before marking.',
    how: 'Camera, lens and lighting capture the part; vision software locates fiducials or features and sends an X / Y / rotation offset that shifts the marking job, so fixture tolerance does not limit mark position.',
    checks: ['Field of view ≥ search area', 'Resolution on the part (µm per pixel) against the required accuracy', 'Working distance fits the machine'],
    interfaces: ['Vision controller / PC (GigE)', 'Trigger from the PLC', 'Lighting'],
    care: ['Clean the lens', 'Re-calibrate camera-to-scanner coordinates after changes'],
  },
  camera_inspect: {
    title: 'Inspection camera (post-mark verification)',
    what: 'Reads and grades every mark before the part leaves the machine.',
    how: 'Captures the marked area; software decodes the 2D code / text and grades print quality (for example to ISO/IEC 15415 or 29158). The result decides OK or NG.',
    checks: ['FOV covers the mark', 'Resolution: enough pixels per code module', 'Lighting geometry for the surface (matte / reflective)'],
    interfaces: ['PLC result input', 'MES / traceability record'],
    care: ['Periodic verification with a reference code'],
  },
  vision_lens: {
    title: 'Vision lens',
    what: 'Images the part onto the camera sensor.',
    how: 'Field of view ≈ sensor size × working distance ÷ focal length (thin-lens estimate); a telecentric lens instead gives FOV = sensor ÷ magnification and no perspective error.',
    checks: ['Sensor coverage (image circle)', 'Mount (C / CS)', 'Working distance and depth of field'],
    interfaces: ['Camera mount'],
    care: ['Lock focus and aperture after setup'],
  },
  light: {
    title: 'Ring light',
    what: 'Illuminates the part for the camera.',
    how: 'LEDs around the lens give even, shadow-free light; the colour is chosen for contrast on the material and it is strobed with the camera trigger.',
    checks: ['Colour / wavelength for contrast', 'Working distance', 'Strobe timing'],
    interfaces: ['Light controller / trigger'],
    care: ['Clean the diffuser'],
  },
  cabinet: {
    title: 'Electrical cabinet',
    what: 'Houses power distribution and controls.',
    how: 'Main switch and circuit breakers feed a 24 V power supply, the PLC and safety controller, servo drives, scanner and vision controllers and the industrial PC, wired through cable ducts and terminal blocks; filter fans or a cooling unit keep it within temperature.',
    checks: ['Heat dissipation against cabinet cooling', 'Short-circuit ratings', 'Space reserve', 'Compliance with machine electrical standards (e.g. IEC 60204-1)'],
    interfaces: ['Mains supply', 'All field devices', 'Network (EtherCAT / PROFINET / Ethernet)'],
    care: ['Clean filter mats', 'Thermal check of terminals'],
  },
  plc: {
    title: 'PLC / motion controller',
    what: 'Runs the machine sequence.',
    how: 'Reads sensors, runs the step sequence (safety check → part present → clamp → vision → move → laser → inspect → unclamp), commands axes over the fieldbus and handshakes with the scanner and vision controllers.',
    checks: ['I/O count', 'Fieldbus (e.g. EtherCAT) for the drives', 'Cycle time'],
    interfaces: ['Drives, I/O, HMI, vision, scanner, MES'],
    care: ['Back up the program'],
  },
  safety_plc: {
    title: 'Safety controller',
    what: 'Executes the safety functions.',
    how: 'Dual-channel monitoring of E-stop, door interlocks and light curtains; switches off laser enable and safe torque off to the drives when a safety input opens.',
    checks: ['Required performance level / SIL per safety function', 'Response time'],
    interfaces: ['Safety inputs', 'Laser enable chain', 'Drive STO'],
    care: ['Periodic proof test of safety functions'],
  },
  servo_drive: {
    title: 'Servo drive',
    what: 'Powers and controls a servo motor.',
    how: 'Converts the supply to controlled motor current and closes the position / velocity / current loops from the encoder; commanded over the fieldbus.',
    checks: ['Rated power / current against the motor', 'Fieldbus', 'STO safety input'],
    interfaces: ['Motor + encoder', 'Fieldbus', 'Safety (STO)'],
    care: ['Keep heat sinks clean'],
  },
  smps: {
    title: '24 V power supply',
    what: 'Supplies control voltage to PLC, sensors, valves and controllers.',
    how: 'Switch-mode supply converting mains to regulated 24 V DC.',
    checks: ['Load with reserve', 'Hold-up time'],
    interfaces: ['Mains', '24 V distribution'],
    care: ['Check output voltage at PM'],
  },
  galvo_controller: {
    title: 'Scanner controller',
    what: 'Executes the marking job.',
    how: 'Turns the marking job (vectors / hatch lines) into synchronised mirror positions and laser on/off / power commands, and applies the field correction table.',
    checks: ['Scanner protocol', 'Laser interface (pulse / analog / digital)', 'Job storage and triggering'],
    interfaces: ['Galvo', 'Laser source', 'PLC / PC'],
    care: ['Back up correction files and jobs'],
  },
  vision_controller: {
    title: 'Vision controller',
    what: 'Runs the image processing.',
    how: 'Receives images, runs the locate / read / grade tools and returns results to the PLC.',
    checks: ['Processing time per image', 'Camera ports'],
    interfaces: ['Cameras', 'PLC'],
    care: ['Back up vision jobs'],
  },
  ipc: {
    title: 'Industrial PC',
    what: 'Hosts the marking software, recipes, data logging and MES connection.',
    how: 'Fanless / industrial PC connected to the scanner controller, cameras and PLC.',
    checks: ['Interfaces (GigE, fieldbus)', 'Storage for traceability data'],
    interfaces: ['Scanner controller', 'Cameras', 'PLC', 'MES'],
    care: ['OS / security updates under change control'],
  },
  hmi: {
    title: 'Operator panel (HMI)',
    what: 'The operator’s window into the machine.',
    how: 'Touch panel showing machine state, counters, recipe and alarms, with start / stop / reset; it talks to the PLC.',
    checks: ['Screens for every alarm with a cause and remedy', 'User levels'],
    interfaces: ['PLC network'],
    care: ['Keep alarm texts current'],
  },
  estop: {
    title: 'Emergency stop',
    what: 'Stops all hazards on demand.',
    how: 'Red mushroom button on a yellow background, latching; its dual contacts open the safety chain — axes stop, laser enable drops. A deliberate reset is needed to restart.',
    checks: ['Reachable from the operator position', 'Stop category from the risk assessment'],
    interfaces: ['Safety controller'],
    care: ['Function test at every PM'],
  },
  tower: {
    title: 'Signal tower',
    what: 'Shows machine state across the shop floor.',
    how: 'Green = running, amber = waiting / needs attention, red = fault.',
    checks: ['Colour meaning agreed with the customer'],
    interfaces: ['PLC outputs'],
    care: ['Lamp test'],
  },
  bin: {
    title: 'OK / NG segregation',
    what: 'Keeps failed parts out of production.',
    how: 'Parts that fail inspection go to a separate (ideally locked) NG bin so they cannot re-enter the good flow.',
    checks: ['NG bin full sensor', 'Lockable NG container'],
    interfaces: ['PLC decision output'],
    care: ['Empty and record NG parts'],
  },
  chiller: {
    title: 'Water chiller',
    what: 'Removes the heat of a water-cooled laser.',
    how: 'Refrigeration circuit keeps coolant at a stable temperature; capacity must exceed the heat load with margin, and stability affects laser power stability.',
    checks: ['Cooling capacity ≥ heat load + margin', 'Temperature stability', 'Flow rate'],
    interfaces: ['Coolant lines', 'Alarm to the laser / PLC'],
    care: ['Coolant change and filter cleaning'],
  },
  frl: {
    title: 'Pneumatic service unit',
    what: 'Prepares compressed air for the machine.',
    how: 'Filter, regulator and a pressure switch that reports “air OK” to the PLC; a soft-start / dump valve releases pressure on stop.',
    checks: ['Supply pressure and consumption', 'Air quality class'],
    interfaces: ['Factory air', 'Valve terminal', 'PLC input'],
    care: ['Drain the filter bowl'],
  },
  valve: {
    title: 'Valve terminal',
    what: 'Switches the pneumatic actuators (clamps).',
    how: 'Solenoid valves on a manifold, driven by PLC outputs, route air to open or close each clamp.',
    checks: ['Number of stations', 'Flow for the clamp speed'],
    interfaces: ['PLC outputs / fieldbus', 'Clamp tubes'],
    care: ['Check for leaks'],
  },
  operator: {
    title: 'Operator (conceptual)',
    what: 'Loads and unloads the part and starts the cycle.',
    how: 'Shown for position only — load / unload times are the station inputs.',
    checks: ['Reach and working height (ergonomics not validated here)'],
    interfaces: ['Door, HMI, E-stop'],
    care: [],
  },
  conveyor: {
    title: 'Conveyor',
    what: 'Transports parts between stations.',
    how: 'Belts or chains driven by a motor; stops and sensors index each part to its station.',
    checks: ['Width range', 'Speed', 'Buffer places'],
    interfaces: ['Upstream / downstream machines (SMEMA)'],
    care: ['Belt tension'],
  },
  robot: {
    title: 'Robot',
    what: 'Handles parts between positions.',
    how: 'A multi-axis arm moves a gripper through taught or calculated paths.',
    checks: ['Reach and payload', 'Cycle time of the path', 'Safeguarding'],
    interfaces: ['Controller', 'Gripper', 'Safety'],
    care: ['Lubrication per maker schedule'],
  },
  laser_source: {
    title: 'Laser source',
    what: 'Generates the laser beam.',
    how: 'Converts electrical power into a laser beam delivered to the head. Wavelength decides which materials absorb it; power, pulse width and repetition rate decide how material is removed or changed.',
    checks: ['Wavelength for the material', 'Average and peak power / pulse energy', 'Beam quality (M²) and output beam diameter', 'Cooling and heat load'],
    interfaces: ['Delivery fibre / beam path', 'Control interface to the scanner controller', 'Safety: laser enable / interlock'],
    care: ['Keep cooling paths clear', 'Log power checks'],
    safety: 'The beam is hazardous to eyes and skin; the enclosure and interlocks provide protection.',
  },
  bridge: {
    title: 'Portal / bridge frame',
    what: 'A rigid frame spanning the conveyor that carries a tool, test head or processing head over the part.',
    how: 'Two or four posts and a beam; the tool slides vertically (and for a head gantry, along the beam) while the part is held below.',
    checks: ['Stiffness at the tool (deflection under process force)', 'Clearance to the conveyor and parts', 'Access for tool change'],
    interfaces: ['Conveyor frame', 'Tool slide / head carriage'],
    care: ['Check fasteners and guide wear'],
  },
  tool: {
    title: 'Process / assembly tool (Z stroke)',
    what: 'The working tool of the station — press ram, screwdriver spindle, dispense valve, dicing spindle, print, bond or pack head.',
    how: 'A Z slide lowers the tool onto the part, it performs its operation (press, screw, dispense a bead, cut, print) and retracts; dispensing, sawing and printing also traverse along the part. The stroke shown follows the station’s work step in the simulation.',
    checks: ['Process force / torque / flow against the part specification', 'Stroke and approach speed', 'Process monitoring (force–displacement, torque–angle, bead inspection)'],
    interfaces: ['Tool controller', 'PLC start / done / OK signals', 'Utilities (air, fluid, power)'],
    care: ['Calibrate force / torque sensors', 'Replace wear parts (bits, nozzles, blades)'],
  },
  test_head: {
    title: 'Test head (contact probes)',
    what: 'Makes electrical (or pneumatic) contact with the part to test it.',
    how: 'A press lowers a platen of spring-loaded probes onto test pads; the tester runs its sequence and returns PASS / FAIL, which routes the part at the sort station.',
    checks: ['Probe count and pitch against the test pads', 'Contact force', 'Test time (drives the station time)', 'Guard against false passes'],
    interfaces: ['Tester / instruments', 'PLC result', 'MES test record'],
    care: ['Replace probes by contact count', 'Golden-part check each shift'],
  },
  pusher: {
    title: 'NG diverter (pusher)',
    what: 'Removes rejected parts from the conveyor.',
    how: 'A pneumatic cylinder extends across the belt and pushes the part into the NG lane or bin; a sensor confirms the reject left the line.',
    checks: ['Stroke and speed against part size / mass', 'Reject confirmation sensor'],
    interfaces: ['Valve terminal', 'PLC decision output'],
    care: ['Check rod seal and cushioning'],
  },
  magazine: {
    title: 'Magazine / stacker',
    what: 'Buffers parts or carriers at the start or end of the line so the line can run while the operator is away.',
    how: 'An elevator indexes the stack one pitch per part: at the infeed it presents the next part, at the outfeed it accepts the finished one.',
    checks: ['Autonomy (parts per load) against operator intervals', 'Pitch and part variation'],
    interfaces: ['Conveyor', 'PLC'],
    care: ['Clean guides'],
  },
  gantry_pp: {
    title: 'Pick-and-place gantry',
    what: 'Moves parts between positions with linear axes.',
    how: 'An X carriage on a portal and a Z quill with a gripper: move above the pick, descend, grip, lift, move, lower, release, return. Each phase is part of the station time.',
    checks: ['Travel and cycle of the pick-place path', 'Gripper suited to the part', 'Payload'],
    interfaces: ['Motion controller', 'Gripper valve / sensor'],
    care: ['Lubricate axes', 'Check gripper pads'],
  },
  tray: {
    title: 'Part / component tray',
    what: 'Presents parts or components to the robot at known positions.',
    how: 'Pockets hold items at fixed pitch; the robot picks them in sequence and the operator (or a feeder) refills the tray.',
    checks: ['Pocket pitch and tolerance', 'Refill interval'],
    interfaces: ['Robot pick positions'],
    care: ['Keep pockets clean'],
  },
  bench: {
    title: 'Operator bench',
    what: 'Manual workplace next to the line.',
    how: 'A work surface with lighting at the manual or load / unload station; manual times are station inputs, not an ergonomic model.',
    checks: ['Working height and reach (ergonomics not validated here)', 'Lighting'],
    interfaces: ['Line conveyor', 'Operator'],
    care: [],
  },
  generic: {
    title: 'Component',
    what: 'A part of the machine.',
    how: 'See its datasheet for function and interfaces.',
    checks: [],
    interfaces: [],
    care: [],
  },
};

function laserGuide(part: Part | undefined, defs: SpecDefs): Guide {
  const base = G.laser_source;
  const wl = specIn(part, 'wavelength', 'nm', defs);
  const mopa = !!part?.specs?.some((s) => s.spec === 'pulse_width_range');
  if (wl != null && wl > 1000 && wl < 1100)
    return {
      ...base,
      title: mopa ? 'Pulsed fibre laser (MOPA)' : 'Fibre laser',
      how: mopa
        ? 'A seed laser (master oscillator) produces nanosecond pulses that ytterbium-doped fibre amplifiers boost (power amplifier). Because the seed is electrically controlled, pulse width and repetition rate can be set independently — useful for tuning contrast on metals, anodised aluminium and plastics. The beam leaves through an armoured delivery fibre.'
        : 'Ytterbium-doped fibre pumped by diodes generates a near-infrared beam around 1 µm, delivered through an armoured fibre. Robust, efficient and air- or water-cooled depending on power.',
    };
  if (wl != null && wl < 400) return { ...base, title: 'UV laser', how: 'A diode-pumped solid-state laser frequency-tripled to the ultraviolet. The short wavelength is absorbed by most plastics and gives a small spot with little heat input (“cold marking”).' };
  if (wl != null && wl > 5000) return { ...base, title: 'CO₂ laser', how: 'A gas laser around 10.6 µm, strongly absorbed by organics, paper, wood, glass and many plastics, but reflected by most metals.' };
  return base;
}

export function guideFor(o: Machine3DObject, part: (Part & AnyRecord) | undefined, stationKind: string | undefined, defs: SpecDefs): Guide {
  const t = part?.product_type;
  if (t === 'laser_source' || o.kind === 'laser_source') return laserGuide(part, defs);
  if (o.kind === 'camera') return stationKind === 'inspect' ? G.camera_inspect : G.camera_align;
  if (o.id.startsWith('motor-') || t === 'servo_motor') return G.servo_motor;
  if (t && G[t]) return G[t];
  if (o.kind === 'generic' && o.params.shape === 'cylinder' && o.stationKey) return G.vision_lens;
  if (o.kind === 'sensor' && /door/i.test(o.name)) return G.door_switch;
  if (o.kind === 'fume') return G.fume;
  return G[o.kind] ?? G.generic;
}

export interface Explanation {
  title: string;
  guide: Guide;
  /** the linked record (model number · type), or null for conceptual objects */
  identity: string | null;
  inThisMachine: string[];
  inCycle: string[];
  warnings: string[];
}

export interface ExplainCtx {
  model: MachineModel;
  res: Resolved;
  cycle: CycleResult | null;
  byId: Map<string, AnyRecord>;
  defs: SpecDefs;
}

const n = (v: number | null | undefined, d = 4) => (v == null ? 'not stated' : fmtNum(v, d));

/** Everything the properties panel says about one 3D object. */
export function explainObject(o: Machine3DObject, x: ExplainCtx): Explanation {
  const { model, res, byId, defs } = x;
  const part = o.partId ? (byId.get(o.partId) as (Part & AnyRecord) | undefined) : undefined;
  const st = o.stationKey ? res.stations.find((s) => s.station.key === o.stationKey) : undefined;
  const guide = guideFor(o, part, st?.station.kind, defs);
  const lines: string[] = [];
  const warn: string[] = [];
  const sp = (k: string, u: string) => specIn(part, k, u, defs);
  const laser = model.lasers.find((l) => [l.sourceId, l.galvoId, l.fthetaId, l.expanderId].includes(o.id)) ?? model.lasers[0];
  const lst = laser ? res.stations.find((s) => s.station.key === laser.stationKey)?.station : undefined;
  const byObj = (id?: string) => (id ? (byId.get(model.byId.get(id)?.partId ?? '') as (Part & AnyRecord) | undefined) : undefined);
  const src = byObj(laser?.sourceId);
  const bex = byObj(laser?.expanderId);
  const galvo = byObj(laser?.galvoId);
  const raw = specIn(src, 'beam_diameter', 'mm', defs);
  const mag = bex ? specIn(bex, 'magnification', '', defs) ?? (bex.specs.find((s) => s.spec === 'magnification')?.value ?? null) : 1;
  const beam = raw != null && mag != null ? raw * mag : null;
  const identity = part ? `${part.model_number} — ${productTypeLabel(part.product_type)}${part.data_type === 'DEMO' ? ' (DEMO record)' : ''}` : null;
  if (!part && o.kind !== 'group' && o.kind !== 'station') lines.push('Conceptual object — no component record is linked; it is drawn so the machine reads correctly.');

  switch (guide === G.servo_motor ? 'servo' : o.kind) {
    case 'laser_source': {
      const wl = sp('wavelength', 'nm');
      const p = sp('average_power', 'W');
      lines.push(`Wavelength ${n(wl)} nm · average power ${n(p)} W · beam diameter ${n(raw)} mm · M² ${n(sp('m2', ''))} · cooling ${part?.specs.find((s) => s.spec === 'cooling_method')?.text ?? 'not stated'} · heat load ${n(sp('heat_load', 'W'))} W.`);
      if (lst?.laser?.power_w != null && lst.laser.frequency_khz != null) {
        const ep = L.pulseEnergy({ power_w: lst.laser.power_w, rep_khz: lst.laser.frequency_khz });
        lines.push(`Process setting ${lst.laser.power_w} W at ${lst.laser.frequency_khz} kHz → pulse energy ≈ ${n(ep.value, 3)} mJ (${ep.formula}).`);
        if (p != null && lst.laser.power_w > p) warn.push(`Process power ${lst.laser.power_w} W exceeds the source’s ${p} W.`);
      }
      break;
    }
    case 'beam_expander':
      lines.push(`Magnification ${n(mag, 3)}× turns the ${n(raw)} mm raw beam into ≈ ${n(beam, 3)} mm.`);
      if (beam != null && galvo) {
        const ap = specIn(galvo, 'aperture', 'mm', defs);
        if (ap != null) (beam > ap ? warn : lines).push(`${beam > ap ? 'Expanded beam' : 'Fits the'} ${n(beam, 3)} mm ${beam > ap ? `is larger than the ${galvo.model_number} aperture ${ap} mm — the beam would be clipped; check with the supplier or choose a smaller magnification / larger aperture.` : `into the ${galvo.model_number} aperture of ${ap} mm.`}`);
      }
      break;
    case 'galvo': {
      const ms = sp('marking_speed', 'mm/s');
      lines.push(`Aperture ${n(sp('aperture', 'mm'))} mm · marking speed ${n(ms)} mm/s · jump speed ${n(sp('jump_speed', 'mm/s'))} mm/s.`);
      if (lst?.laser?.speed_mm_s != null && ms != null) (lst.laser.speed_mm_s > ms ? warn : lines).push(`Recipe speed ${lst.laser.speed_mm_s} mm/s ${lst.laser.speed_mm_s > ms ? 'exceeds' : 'is within'} the stated marking speed ${ms} mm/s.`);
      break;
    }
    case 'f_theta': {
      const f = sp('focal_length', 'mm');
      lines.push(`Focal length ${n(f)} mm · field ${n(laser?.field ?? null)} × ${n(laser?.field ?? null)} mm · working distance ${n(laser?.wd ?? null)} mm — so the part surface sits ${n(laser?.wd ?? null)} mm below the lens.`);
      const spot = L.spotDiameter({ wavelength_nm: specIn(src, 'wavelength', 'nm', defs), focal_mm: f, m2: specIn(src, 'm2', '', defs) ?? (src?.specs.find((s) => s.spec === 'm2')?.value ?? null), beam_mm: beam });
      if (spot.value != null) {
        const dof = L.depthOfFocus({ spot_um: spot.value, wavelength_nm: specIn(src, 'wavelength', 'nm', defs), m2: src?.specs.find((s) => s.spec === 'm2')?.value ?? null });
        lines.push(`Estimated focused spot ≈ ${n(spot.value, 3)} µm and depth of focus ≈ ${n(dof.value, 3)} mm (diffraction-limited estimates, ${spot.formula}).`);
      }
      if (model.processArea && laser?.field) lines.push(`The required area ${model.processArea.x} × ${model.processArea.y} mm uses ${Math.round((Math.max(model.processArea.x, model.processArea.y) / laser.field) * 100)} % of the field width.`);
      break;
    }
    case 'camera': {
      const v = model.vision.find((q) => q.cameraId === o.id);
      if (v?.fovX != null) {
        const rx = sp('resolution_x', 'px');
        lines.push(`Field of view ${n(v.fovX, 3)} × ${n(v.fovY, 3)} mm at ${v.wd} mm working distance (${v.basis}).`);
        if (rx) lines.push(`≈ ${n((v.fovX / rx) * 1000, 3)} µm per pixel on the part (${rx} px across).`);
        if (v.target) (v.fovX < v.target.x || (v.fovY ?? 0) < v.target.y ? warn : lines).push(`Target area ${v.target.x} × ${v.target.y} mm ${v.fovX < v.target.x || (v.fovY ?? 0) < v.target.y ? 'is NOT covered' : 'is covered'}.`);
      } else if (v) warn.push(`FOV not computable — missing ${v.missing.join(', ')}.`);
      break;
    }
    case 'xy_stage': {
      const a = model.axes.find((q) => q.key === o.params.axis);
      if (a) {
        lines.push(`${a.name}: travel ${n(a.stroke)} mm · speed ${n(a.speed)} mm/s · acceleration ${n(a.accel)} mm/s² (${a.sources.speed}).`);
        for (const m of model.plan) {
          const pa = m.perAxis.find((q) => q.axis === a.key);
          if (pa && pa.dist !== 0) lines.push(`${m.label}: ${n(Math.abs(pa.dist))} mm in ${pa.time != null ? `${n(pa.time, 3)} s` : 'not defined'} (calculated).`);
        }
      }
      break;
    }
    case 'fixture':
      lines.push(`Holds a ${model.workpiece.template.replace('_', ' ')} ${model.workpiece.length} × ${model.workpiece.width} × ${model.workpiece.thickness} mm (${model.workpiece.basis}) with ${o.params.clamps ?? 2} clamps; rides on the XY table through every station.`);
      break;
    case 'enclosure':
    case 'door': {
      const load = res.stations.find((s) => s.station.kind === 'load');
      const unload = res.stations.find((s) => s.station.kind === 'unload');
      if (load && unload) lines.push(`The door is open during “${load.station.name}” (${n(load.time, 3)} s) and “${unload.station.name}” (${n(unload.time, 3)} s); the laser can only fire with it closed.`);
      break;
    }
    case 'cabinet': {
      const inside = model.objects.filter((q) => q.parentId === 'cabinet').map((q) => q.name);
      lines.push(inside.length ? `Contains: ${inside.join('; ')}.` : 'No controller records are selected yet.');
      break;
    }
    case 'fume':
      lines.push(`Air flow ${n(sp('airflow', 'm³/h'))} m³/h · filter efficiency ${part?.specs.find((s) => s.spec === 'filter_efficiency')?.original ?? 'not stated'}.`);
      break;
    case 'servo':
      lines.push(`Rated power ${n(sp('rated_power', 'W'))} W · torque ${n(sp('rated_torque', 'N·m'))} N·m · speed ${n(sp('rated_speed', 'rpm'))} rpm.`);
      break;
    default:
      break;
  }

  // cycle participation, with the basis of every time (§164)
  const cyc: string[] = [];
  if (st) {
    cyc.push(`Works in “${st.station.name}”: ${st.time != null ? `${n(st.time, 3)} s per part` : 'time not defined'} (${st.basis === 'CALCULATED' ? 'calculated' : st.basis === 'DEMO' ? 'DEMO station time' : st.basis.toLowerCase()}).`);
    const load = x.cycle?.loads.find((l) => l.rs.station.key === st.station.key);
    if (load) cyc.push(`Share of the cycle: ${Math.round(load.utilization * 100)} %${x.cycle?.bottleneck.rs.station.key === st.station.key ? ' — this is the bottleneck station' : ''}.`);
  } else if (o.carriedBy?.length || o.kind === 'xy_stage') {
    const t = model.plan.reduce((s, m) => s + (m.time ?? 0), 0);
    cyc.push(`Moves in every cycle: ${model.plan.length} moves, ${n(t, 3)} s of axis motion per part (calculated).`);
  }
  return { title: guide.title, guide, identity, inThisMachine: lines, inCycle: cyc, warnings: warn };
}

/* ------------------------------------------------------------------ guided tour (§139, §180) */

export interface TourStep {
  key: string;
  title: string;
  lines: string[];
  focus: string | null;
  highlight: string[];
  preset?: 'iso' | 'laser' | 'inspection' | 'maintenance' | 'front' | 'top';
}

export function machineTour(x: ExplainCtx): TourStep[] {
  const { model, res, cycle } = x;
  const ids = (pred: (o: Machine3DObject) => boolean) => model.objects.filter(pred).map((o) => o.id);
  const st = (kind: string) => res.stations.find((s) => s.station.kind === kind);
  const t = (s?: { time: number | null }) => (s?.time != null ? `${n(s.time, 3)} s` : 'time not defined');
  const laser = model.lasers[0];
  const steps: TourStep[] = [];
  steps.push({
    key: 'overview',
    title: 'The machine',
    lines: [
      `${res.sim.name}. ${res.layout === 'sequential' ? 'One part is in the machine at a time; stations work one after the other.' : 'Stations work concurrently on consecutive parts.'}`,
      `Conceptual size ${Math.round(model.dims.width)} × ${Math.round(model.dims.depth)} × ${Math.round(model.dims.height)} mm (W × D × H).`,
      cycle ? `Cycle ${n(cycle.cycle, 3)} s → ${n(cycle.theoreticalUph, 4)} UPH theoretical, ${n(cycle.practicalUph, 4)} UPH practical at OEE ${Math.round(cycle.oee * 100)} %.` : 'The cycle cannot be computed yet — see the input gaps.',
    ],
    focus: null,
    highlight: [],
    preset: 'iso',
  });
  if (model.byId.has('enclosure'))
    steps.push({
      key: 'safety',
      title: 'Enclosure and safety',
      lines: [G.enclosure.what, 'The loading door is interlocked: the laser can only be enabled with the door closed. E-stop and signal tower are on the operator side.', G.enclosure.safety!],
      focus: 'enclosure',
      highlight: ids((o) => ['enclosure', 'door', 'door-switch', 'estop', 'tower'].includes(o.id)),
      preset: 'front',
    });
  const load = st('load');
  if (load)
    steps.push({
      key: 'load',
      title: 'Loading and fixture',
      lines: [`${load.station.name}: ${t(load)}. The operator places the part in the fixture; the part-present sensor confirms it.`, `${st('fixture')?.station.name ?? 'Clamp'}: ${t(st('fixture'))} — pneumatic clamps press the part flat so it stays within the depth of focus.`],
      focus: 'fixture',
      highlight: ids((o) => o.id === 'fixture' || o.kind === 'operator' || (o.stationKey === load.station.key && o.kind === 'sensor')),
    });
  if (model.axes.length)
    steps.push({
      key: 'motion',
      title: 'XY motion system',
      lines: [G.xy_stage.how, ...model.axes.map((a) => `${a.name}: ${n(a.speed)} mm/s, ${n(a.accel)} mm/s², travel ${n(a.stroke)} mm (${a.sources.speed}).`), `${model.plan.length} moves per part, ${n(model.plan.reduce((s, m) => s + (m.time ?? 0), 0), 3)} s in total — calculated and included in the cycle.`],
      focus: 'axis-x',
      highlight: ids((o) => o.layer === 'Motion'),
    });
  const align = st('align') ?? st('vision');
  if (align) {
    const v = model.vision.find((q) => q.stationKey === align.station.key);
    steps.push({
      key: 'align',
      title: align.station.name,
      lines: [G.camera_align.how, v?.fovX != null ? `FOV ${n(v.fovX, 3)} × ${n(v.fovY, 3)} mm at ${v.wd} mm.` : 'FOV not computable yet.', `Station time ${t(align)}.`],
      focus: v?.cameraId ?? null,
      highlight: ids((o) => o.stationKey === align.station.key),
      preset: 'inspection',
    });
  }
  if (laser) {
    steps.push({
      key: 'source',
      title: 'Laser source and beam delivery',
      lines: [explainObject(model.byId.get(laser.sourceId!)!, x).guide.how, ...explainObject(model.byId.get(laser.sourceId!)!, x).inThisMachine, laser.mode === 'head' ? 'The armoured fibre carries the beam to the processing head on the gantry.' : 'The armoured fibre carries the beam up to the collimator on the column; the beam expander enlarges it before the scanner.'],
      focus: laser.sourceId ?? null,
      highlight: ids((o) => o.layer === 'Laser' && (o.kind === 'laser_source' || o.kind === 'collimator' || o.kind === 'beam_expander')),
    });
    const ftObj = laser.fthetaId ? model.byId.get(laser.fthetaId) : undefined;
    const headObj = laser.headId ? model.byId.get(laser.headId) : undefined;
    steps.push(
      laser.mode === 'head'
        ? {
            key: 'scan',
            title: 'Processing head on a gantry',
            lines: [G.laser_head.how, 'The gantry moves the head along the seam while the laser fires; the path length ÷ speed × passes sets the process time.', ...(headObj ? explainObject(headObj, x).inThisMachine : [])],
            focus: laser.headId ?? null,
            highlight: ids((o) => o.id === laser.headId || (o.stationKey === laser.stationKey && (o.kind === 'bridge' || o.kind === 'xy_stage'))),
            preset: 'laser',
          }
        : {
            key: 'scan',
            title: 'Scan head: galvo + f-theta',
            lines: [G.galvo.how, ...(ftObj ? explainObject(ftObj, x).inThisMachine : [])],
            focus: laser.galvoId ?? null,
            highlight: ids((o) => o.id === laser.galvoId || o.id === laser.fthetaId),
            preset: 'laser',
          },
    );
    const ls = res.stations.find((s) => s.station.key === laser.stationKey);
    steps.push({
      key: 'process',
      title: 'Marking process',
      lines: [
        ls?.station.laser?.area_mm2 != null ? `Filled area ${ls.station.laser.area_mm2} mm² at hatch ${ls.station.laser.hatch_mm} mm and ${ls.station.laser.speed_mm_s} mm/s, ${ls.station.laser.passes ?? 1} pass(es), plus ${ls.station.laser.jump_overhead_s ?? 0} s jumps → laser time calculated as area ÷ (hatch × speed) × passes + overhead.` : `Laser time: ${t(ls)}.`,
        `Station total incl. the move: ${t(ls)}.`,
        'Fume extraction runs while marking; the scan path shown in 3D is symbolic.',
      ],
      focus: laser.fthetaId ?? null,
      highlight: ids((o) => o.stationKey === laser.stationKey),
      preset: 'laser',
    });
  }
  const insp = st('inspect');
  if (insp) {
    const v = model.vision.find((q) => q.stationKey === insp.station.key);
    steps.push({ key: 'inspect', title: insp.station.name, lines: [G.camera_inspect.how, `Station time ${t(insp)} · reject rate ${insp.station.reject_rate != null ? `${insp.station.reject_rate * 100} %` : 'not stated'}.`], focus: v?.cameraId ?? null, highlight: ids((o) => o.stationKey === insp.station.key || o.kind === 'bin'), preset: 'inspection' });
  }
  const unload = st('unload');
  if (unload) steps.push({ key: 'unload', title: unload.station.name, lines: [`${t(unload)} — the stage returns to the load position, the door opens and the operator removes the part.`], focus: 'door', highlight: ids((o) => o.stationKey === unload.station.key || o.id === 'door') });
  steps.push({ key: 'controls', title: 'Controls and electrical', lines: [G.cabinet.how, explainObject(model.byId.get('cabinet')!, x).inThisMachine.join(' ')], focus: 'cabinet', highlight: ids((o) => o.parentId === 'cabinet' || o.id === 'cabinet' || o.id === 'hmi'), preset: 'maintenance' });
  if (cycle)
    steps.push({
      key: 'performance',
      title: 'How the cycle time is built',
      lines: [
        `${cycle.layout === 'sequential' ? 'Cycle = Σ station times' : 'Cycle = slowest station'}: ${res.stations.map((s) => `${s.station.name} ${s.time != null ? n(s.time, 3) : '—'} s`).join(' + ')} = ${n(cycle.cycle, 3)} s.`,
        `Bottleneck: ${cycle.bottleneck.rs.station.name} (${n(cycle.bottleneck.mean, 3)} s).`,
        res.sim.targets?.uph ? `Target ${res.sim.targets.uph} UPH → ${cycle.practicalUph >= res.sim.targets.uph ? 'met' : 'not met'} (${n(cycle.practicalUph, 4)} UPH practical).` : 'No UPH target set.',
      ],
      focus: null,
      highlight: ids((o) => o.stationKey === cycle.bottleneck.rs.station.key),
      preset: 'iso',
    });
  return steps;
}

/* ------------------------------------------------------------------ live narration (§98, §164) */

const pickPhase = (u: number) => (u < 0.2 ? 'moves to the pick' : u < 0.35 ? 'descends and grips' : u < 0.45 ? 'lifts' : u < 0.7 ? 'moves to the place' : u < 0.85 ? 'lowers and releases' : 'returns home');

const TOOL_NAME: Record<string, string> = { press: 'press ram', screw: 'screwdriver spindle', dispense: 'dispense valve', saw: 'dicing spindle', print: 'print / code head', bond: 'bond head', pack: 'packing head', generic: 'process head' };

export function narrate(step: SubStep | null, stationName: string, progress: number, x: ExplainCtx): string {
  if (!step) return '';
  const pct = `${Math.round(progress * 100)} %`;
  switch (step.kind) {
    case 'move': {
      const m = step.move!;
      const parts = m.perAxis.filter((p) => p.dist !== 0).map((p) => `${p.axis.toUpperCase()} ${p.dist > 0 ? '+' : ''}${n(p.dist, 4)} mm`);
      return `${m.label}: ${parts.join(', ') || 'no travel'} in ${n(m.time, 3)} s — trapezoidal profile from the stage speed and acceleration (${pct}).`;
    }
    case 'load':
      return x.model.carrier === 'axes'
        ? `${stationName}: the door is open; the operator places the part and closes the door (${n(step.dur, 3)} s, ${step.basis}).`
        : `${stationName}: the next part enters the line${x.model.objects.some((o) => o.kind === 'magazine') ? ' from the infeed magazine' : ''} and is indexed to the first station (${n(step.dur, 3)} s, ${step.basis}).`;
    case 'clamp':
      return `${stationName}: clamps close and the reed switch confirms (${n(step.dur, 3)} s, ${step.basis}).`;
    case 'vision':
      return `${stationName}: camera triggered with the ring light; the image is processed and the position offset is sent to the ${x.model.lasers.length ? 'scanner' : 'controller'} (${n(step.dur, 3)} s).`;
    case 'laser_prep':
      return `${stationName}: laser enabled — interlocks and extraction confirmed; jump / overhead time ${n(step.dur, 3)} s.`;
    case 'laser': {
      const st = x.res.stations.find((s) => s.station.name === stationName);
      const lst = st?.station.laser;
      const lp = x.model.lasers.find((l) => l.stationKey === st?.station.key);
      const params = [lst?.power_w != null ? `${lst.power_w} W` : null, lst?.speed_mm_s != null ? `${lst.speed_mm_s} mm/s` : null, lst?.frequency_khz != null ? `${lst.frequency_khz} kHz` : null].filter(Boolean).join(', ');
      const how = lp?.mode === 'head' ? `the gantry moves the processing head along the ${lp.process === 'welding' ? 'weld seam' : 'path'}` : 'galvo mirrors steer the beam through the f-theta lens';
      return `${stationName}: ${how}${params ? ` at ${params}` : ''} — ${pct} of ${n(step.dur, 3)} s (${step.basis}).`;
    }
    case 'inspect': {
      const st = x.res.stations.find((s) => s.station.name === stationName);
      const rej = st?.station.reject_rate != null ? `; entered reject rate ${n(st.station.reject_rate * 100, 3)} %` : '';
      if (st?.station.kind === 'test') {
        const phase = progress < 0.2 ? 'the test head descends onto the part' : progress <= 0.8 ? 'contact probes are made and the tester runs the test program' : 'the test head retracts with the PASS / FAIL result';
        const lanes = (st.station.parallel ?? 1) > 1 && x.res.layout !== 'sequential' ? ` (${st.station.parallel} parallel nests, each testing its own part)` : '';
        return `${stationName}: ${phase}${lanes} — ${pct} of ${n(step.dur, 3)} s (${step.basis}${rej}).`;
      }
      return `${stationName}: the verification camera ${x.model.lasers.length ? 'reads and grades the mark' : 'checks the part'} → OK / NG (${n(step.dur, 3)} s${rej}).`;
    }
    case 'sort': {
      const st = x.res.stations.find((s) => s.station.name === stationName);
      const pusher = st && x.model.objects.some((o) => o.kind === 'pusher' && o.stationKey === st.station.key);
      return pusher
        ? `${stationName}: PASS parts ride through; a part the run rejects is pushed off the belt by the pneumatic diverter into the NG bin (${n(step.dur, 3)} s).`
        : `${stationName}: result routed — NG parts go to the NG bin (${n(step.dur, 3)} s).`;
    }
    case 'unload':
      return x.model.carrier === 'axes' ? `${stationName}: door opens, operator removes the part (${n(step.dur, 3)} s, ${step.basis}).` : `${stationName}: the finished part leaves the line to the outfeed (${n(step.dur, 3)} s, ${step.basis}).`;
    default: {
      const st = x.res.stations.find((s) => s.station.name === stationName);
      const hd = st ? x.model.handlers[st.station.key] : undefined;
      if (hd) {
        const ph = pickPhase(progress);
        return `${stationName}: ${hd.kind === 'robot' ? 'robot' : 'gantry'} ${ph} — ${hd.carries === 'part' ? 'moving the part downstream' : 'placing a component onto the part'} (${n(step.dur, 3)} s, ${step.basis}).`;
      }
      const tool = st ? x.model.objects.find((o) => o.stationKey === st.station.key && (o.kind === 'tool' || o.kind === 'test_head')) : undefined;
      if (tool) {
        const phase = progress < 0.2 ? 'lowers to the part' : progress <= 0.8 ? 'is working' : 'retracts';
        return `${stationName}: ${tool.kind === 'test_head' ? `test head ${phase}` : `${TOOL_NAME[String(tool.params.tool)] ?? 'tool'} ${phase}`} — ${pct} of ${n(step.dur, 3)} s (${step.basis}).`;
      }
      return `${stationName}: ${step.name} (${n(step.dur, 3)} s).`;
    }
  }
}
