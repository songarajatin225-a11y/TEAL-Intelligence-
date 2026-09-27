/**
 * GLOBAL ENGINEERING DATABASE + EQUIPMENT SIMULATION seed (industrial intelligence master prompt).
 *
 * Writes:
 *   data/engineering/spec-definitions.json      specification catalogue (§12, §15–§35) — parameter NAMES
 *                                              from the master prompt, no values
 *   data/engineering/compatibility-rules.json   engineering rules (§44) — DRAFT until TEAL reviews them
 *   data/engineering/equipment-templates.json   equipment structures (§60, §61) — station times UNKNOWN
 *   data/demo/engineering-*.json                DEMO manufacturers, products, relationships, conflicts,
 *                                              simulation scenarios, recipe and verification
 *
 * Nothing here is a real manufacturer's specification. Every product, manufacturer, price and
 * station time is fictional DEMO data with a DEMO source; real data enters through the reviewed
 * ingestion pipeline (docs/INGESTION.md).
 *
 *   npx tsx scripts/data/buildEngineeringData.ts
 */
import { join } from 'node:path';
import { DATA_DIR, writeJson } from '../lib/dataset';

const TODAY = '2026-09-27';
const SRC = 'src-sim-master-prompt';

const hdr = (id: string, title: string, entity: string, description: string, data_type: string, source_ids: string[], partition = 'engineering') => ({
  id,
  title,
  entity,
  description,
  version: '1.0.0',
  last_updated: TODAY,
  data_type,
  source_ids,
  partition,
});

/* ------------------------------------------------------------ spec definitions */

const LASERS = ['laser_source', 'laser_module', 'laser_engine'];
const OPTICS = ['galvo', 'f_theta', 'beam_expander', 'mirror', 'lens', 'window', 'collimator', 'polarizer', 'waveplate', 'filter', 'dichroic', 'isolator', 'beam_delivery', 'laser_head', 'fiber', 'aom', 'eom'];
const POWERED = [...LASERS, 'laser_controller', 'laser_driver', 'chiller', 'fume_extraction', 'galvo', 'galvo_controller', 'camera', 'lighting', 'vision_controller', 'servo_motor', 'servo_drive', 'linear_motor', 'motion_controller', 'plc', 'hmi', 'ipc', 'sensor', 'robot', 'robot_controller', 'safety_plc', 'safety_relay', 'light_curtain', 'safety_scanner', 'smps', 'conveyor', 'vacuum_generator'];
const MECH_ALL = ['*'];

type Opt = { aliases?: string[]; enum?: string[]; filterable?: boolean; min?: number; max?: number; allowed?: string[]; desc?: string };
const specs: Record<string, unknown>[] = [];
function S(key: string, name: string, category: string, spec_type: 'number' | 'range' | 'text' | 'enum' | 'boolean', unit_type: string, canonical: string | undefined, applies_to: string[], o: Opt = {}) {
  specs.push({
    id: `spd-${key.replace(/_/g, '-')}`,
    entity: 'spec_definition',
    name,
    key,
    category,
    spec_type,
    unit_type,
    ...(canonical ? { canonical_unit: canonical } : {}),
    ...(o.allowed ? { allowed_units: o.allowed } : {}),
    applies_to,
    ...(o.enum ? { enum_values: o.enum } : {}),
    ...(o.min != null || o.max != null ? { validation: { ...(o.min != null ? { min: o.min } : {}), ...(o.max != null ? { max: o.max } : {}) } } : {}),
    ...(o.aliases ? { aliases: o.aliases } : {}),
    filterable: o.filterable ?? spec_type !== 'text',
    ...(o.desc ? { description: o.desc } : {}),
    data_type: 'TEAL_INTERNAL',
    provenance: { source_id: SRC, verification_status: 'SOURCE_DOCUMENTED', note: 'Parameter name from the master prompt specification catalogue; holds no value.' },
  });
}

// Laser source (§15) and module (§16)
S('wavelength', 'Wavelength', 'Optical', 'number', 'length', 'nm', [...LASERS, 'lighting', 'laser_head'], { aliases: ['wavelength', 'lambda', 'λ'], min: 100, max: 20000, allowed: ['nm', 'µm'] });
S('wavelength_range', 'Wavelength range', 'Optical', 'range', 'length', 'nm', [...LASERS, ...OPTICS], { aliases: ['wavelength range', 'coating range', 'design wavelength'] });
S('average_power', 'Average power', 'Power', 'number', 'power', 'W', [...LASERS], { aliases: ['power', 'average power', 'output power'], min: 0 });
S('maximum_power', 'Maximum power', 'Power', 'number', 'power', 'W', [...LASERS], { min: 0 });
S('minimum_power', 'Minimum power', 'Power', 'number', 'power', 'W', [...LASERS], { min: 0 });
S('peak_power', 'Peak power', 'Power', 'number', 'power', 'kW', [...LASERS], { min: 0 });
S('pulse_energy', 'Pulse energy', 'Pulse', 'number', 'energy', 'mJ', [...LASERS], { aliases: ['pulse energy'], min: 0 });
S('pulse_width', 'Pulse width', 'Pulse', 'number', 'time', 'ns', [...LASERS], { aliases: ['pulse width', 'pulse duration'], min: 0 });
S('pulse_width_range', 'Pulse width range', 'Pulse', 'range', 'time', 'ns', [...LASERS]);
S('repetition_rate', 'Repetition rate', 'Pulse', 'number', 'frequency', 'kHz', [...LASERS], { aliases: ['frequency', 'repetition rate', 'rep rate', 'prf'] });
S('repetition_rate_range', 'Repetition rate range', 'Pulse', 'range', 'frequency', 'kHz', [...LASERS], { aliases: ['frequency range'] });
S('pulse_shape', 'Pulse shape', 'Pulse', 'text', 'none', undefined, [...LASERS]);
S('beam_diameter', 'Beam diameter (output)', 'Beam', 'number', 'length', 'mm', [...LASERS, 'collimator'], { aliases: ['beam diameter'], min: 0 });
S('beam_divergence', 'Beam divergence', 'Beam', 'number', 'angle', 'mrad', [...LASERS, 'beam_expander'], { min: 0 });
S('m2', 'M² (beam quality factor)', 'Beam', 'number', 'none', undefined, [...LASERS], { aliases: ['m2', 'm²', 'beam quality'], min: 1 });
S('beam_quality', 'Beam quality (as published)', 'Beam', 'text', 'none', undefined, [...LASERS]);
S('polarization', 'Polarization', 'Beam', 'text', 'none', undefined, [...LASERS, 'polarizer', 'waveplate']);
S('power_stability', 'Power stability', 'Stability', 'number', 'dimensionless', '%', [...LASERS], { min: 0 });
S('pointing_stability', 'Pointing stability', 'Stability', 'number', 'angle', 'µrad', [...LASERS], { min: 0 });
S('cooling_method', 'Cooling method', 'Thermal', 'enum', 'none', undefined, [...LASERS, 'galvo', 'laser_head', 'f_theta'], { enum: ['Air', 'Water', 'Conduction', 'Passive'] });
S('coolant', 'Coolant', 'Thermal', 'text', 'none', undefined, [...LASERS, 'chiller']);
S('heat_load', 'Heat load to remove', 'Thermal', 'number', 'power', 'W', [...LASERS, 'laser_head', 'galvo'], { aliases: ['heat load', 'cooling requirement'], min: 0 });
S('operating_temperature', 'Operating temperature', 'Environment', 'range', 'temperature', '°C', MECH_ALL);
S('storage_temperature', 'Storage temperature', 'Environment', 'range', 'temperature', '°C', MECH_ALL);
S('humidity', 'Humidity (non-condensing)', 'Environment', 'range', 'dimensionless', '%', MECH_ALL);
S('altitude', 'Altitude', 'Environment', 'number', 'length', 'm', MECH_ALL);
S('dimensions', 'Dimensions', 'Physical', 'text', 'none', undefined, MECH_ALL, { filterable: false });
S('weight', 'Weight', 'Physical', 'number', 'mass', 'kg', MECH_ALL, { aliases: ['weight', 'mass'], min: 0 });
S('input_voltage', 'Input voltage', 'Electrical', 'number', 'voltage', 'V', POWERED, { aliases: ['voltage', 'supply voltage'], min: 0 });
S('input_power', 'Input power (rated)', 'Electrical', 'number', 'power', 'W', POWERED, { min: 0 });
S('power_consumption', 'Power consumption (typical)', 'Electrical', 'number', 'power', 'W', POWERED, { aliases: ['power consumption', 'consumption'], min: 0 });
S('trigger_input', 'Trigger input', 'I/O', 'text', 'none', undefined, [...LASERS, 'camera', 'lighting']);
S('trigger_output', 'Trigger output', 'I/O', 'text', 'none', undefined, [...LASERS, 'camera']);
S('analog_input', 'Analog input', 'I/O', 'text', 'none', undefined, [...LASERS, 'plc', 'servo_drive']);
S('digital_input', 'Digital input', 'I/O', 'text', 'none', undefined, [...LASERS, 'plc']);
S('connector', 'Connector', 'I/O', 'text', 'none', undefined, MECH_ALL);
S('lifetime', 'Lifetime (as published)', 'Life', 'number', 'time', 'h', [...LASERS, 'lighting', 'fume_extraction'], { min: 0 });
S('warranty', 'Warranty', 'Commercial', 'text', 'none', undefined, MECH_ALL);
S('module_type', 'Module type', 'Module', 'text', 'none', undefined, ['laser_module']);
S('modulation', 'Modulation', 'Module', 'text', 'none', undefined, ['laser_module', 'laser_driver', 'aom', 'eom']);
S('ttl_control', 'TTL control', 'Module', 'boolean', 'none', undefined, ['laser_module', 'laser_driver']);
S('analog_control', 'Analog control', 'Module', 'boolean', 'none', undefined, ['laser_module', 'laser_driver']);
S('tec', 'TEC', 'Module', 'boolean', 'none', undefined, ['laser_module']);
S('photodiode', 'Monitor photodiode', 'Module', 'boolean', 'none', undefined, ['laser_module']);
S('supply_current', 'Supply current', 'Electrical', 'number', 'current', 'A', ['laser_module', 'laser_driver', 'lighting', 'smps'], { min: 0 });
S('package', 'Package', 'Module', 'text', 'none', undefined, ['laser_module']);
// Galvo (§17)
S('aperture', 'Aperture', 'Optical', 'number', 'length', 'mm', ['galvo', 'beam_delivery', 'laser_head'], { aliases: ['aperture', 'clear aperture', 'input aperture'], min: 0 });
S('scan_angle', 'Scan angle (optical)', 'Scan', 'number', 'angle', '°', ['galvo'], { aliases: ['scan angle', 'optical angle'] });
S('mechanical_angle', 'Mechanical angle', 'Scan', 'number', 'angle', '°', ['galvo']);
S('marking_speed', 'Marking speed', 'Scan', 'number', 'speed', 'mm/s', ['galvo'], { aliases: ['marking speed'] });
S('jump_speed', 'Jump / positioning speed', 'Scan', 'number', 'speed', 'mm/s', ['galvo'], { aliases: ['jump speed', 'positioning speed'] });
S('settling_time', 'Settling time', 'Scan', 'number', 'time', 'ms', ['galvo', 'linear_stage'], { min: 0 });
S('step_response', 'Step response (1 % of full scale)', 'Scan', 'number', 'time', 'ms', ['galvo'], { min: 0 });
S('angular_repeatability', 'Repeatability (angular)', 'Scan', 'number', 'angle', 'µrad', ['galvo', 'rotary_stage'], { min: 0 });
S('drift', 'Drift', 'Scan', 'text', 'none', undefined, ['galvo']);
S('long_term_drift', 'Long-term drift', 'Scan', 'number', 'angle', 'µrad', ['galvo']);
S('mirror_material', 'Mirror material', 'Optical', 'text', 'none', undefined, ['galvo', 'mirror']);
S('mirror_coating', 'Mirror coating', 'Optical', 'text', 'none', undefined, ['galvo', 'mirror']);
S('max_power', 'Maximum laser power (rated)', 'Power', 'number', 'power', 'W', [...OPTICS, 'fiber'], { aliases: ['max power', 'rated power', 'power rating'], min: 0 });
S('encoder_type', 'Encoder / position detector', 'Scan', 'text', 'none', undefined, ['galvo', 'servo_motor', 'linear_stage', 'encoder']);
// F-theta (§18)
S('focal_length', 'Focal length', 'Optical', 'number', 'length', 'mm', ['f_theta', 'lens', 'vision_lens', 'laser_head', 'collimator'], { aliases: ['focal length', 'f'], min: 0 });
S('scan_field_x', 'Scan field X', 'Optical', 'number', 'length', 'mm', ['f_theta'], { aliases: ['field', 'scan field', 'marking field'], min: 0 });
S('scan_field_y', 'Scan field Y', 'Optical', 'number', 'length', 'mm', ['f_theta'], { min: 0 });
S('scan_field_diameter', 'Scan field diameter', 'Optical', 'number', 'length', 'mm', ['f_theta'], { min: 0 });
S('working_distance', 'Working distance', 'Optical', 'number', 'length', 'mm', ['f_theta', 'vision_lens', 'telecentric_lens', 'laser_head', 'lighting'], { aliases: ['working distance', 'wd'], min: 0 });
S('back_focal_distance', 'Back focal distance', 'Optical', 'number', 'length', 'mm', ['f_theta']);
S('entrance_beam_diameter', 'Entrance beam diameter (max)', 'Optical', 'number', 'length', 'mm', ['f_theta', 'laser_head'], { aliases: ['entrance beam', 'input beam'], min: 0 });
S('exit_beam_diameter', 'Exit beam diameter', 'Optical', 'number', 'length', 'mm', ['f_theta']);
S('clear_aperture', 'Clear aperture', 'Optical', 'number', 'length', 'mm', ['f_theta', 'beam_expander', 'mirror', 'lens', 'window', 'filter', 'dichroic'], { min: 0 });
S('telecentric', 'Telecentric', 'Optical', 'boolean', 'none', undefined, ['f_theta', 'vision_lens', 'telecentric_lens']);
S('distortion', 'Distortion', 'Optical', 'number', 'dimensionless', '%', ['f_theta', 'vision_lens', 'telecentric_lens']);
S('transmission', 'Transmission', 'Optical', 'number', 'dimensionless', '%', [...OPTICS], { min: 0, max: 100 });
S('coating', 'Coating', 'Optical', 'text', 'none', undefined, [...OPTICS]);
S('damage_threshold', 'Damage threshold', 'Optical', 'number', 'fluence', 'J/cm²', [...OPTICS], { min: 0 });
S('surface_quality', 'Surface quality (scratch-dig)', 'Optical', 'text', 'none', undefined, [...OPTICS]);
S('flatness', 'Flatness', 'Optical', 'text', 'none', undefined, ['mirror', 'window', 'f_theta']);
S('mount_type', 'Mount type', 'Mechanical', 'text', 'none', undefined, [...OPTICS]);
S('thread', 'Thread', 'Mechanical', 'text', 'none', undefined, [...OPTICS, 'vision_lens']);
// Beam expander (§19), optics (§20)
S('magnification', 'Magnification', 'Optical', 'number', 'none', undefined, ['beam_expander', 'vision_lens', 'telecentric_lens'], { aliases: ['magnification', 'expansion'], min: 0 });
S('input_beam_diameter', 'Input beam diameter (max)', 'Optical', 'number', 'length', 'mm', ['beam_expander'], { min: 0 });
S('output_beam_diameter', 'Output beam diameter', 'Optical', 'number', 'length', 'mm', ['beam_expander', 'collimator'], { min: 0 });
S('adjustment', 'Adjustment', 'Optical', 'text', 'none', undefined, ['beam_expander']);
S('material', 'Material', 'Physical', 'text', 'none', undefined, MECH_ALL);
S('diameter', 'Diameter', 'Physical', 'number', 'length', 'mm', ['mirror', 'lens', 'window', 'polarizer', 'waveplate', 'filter', 'dichroic'], { min: 0 });
S('thickness', 'Thickness', 'Physical', 'number', 'length', 'mm', ['mirror', 'lens', 'window', 'filter'], { min: 0 });
S('reflectivity', 'Reflectivity', 'Optical', 'number', 'dimensionless', '%', ['mirror', 'galvo', 'dichroic'], { min: 0, max: 100 });
// Laser head (§21)
S('spot_size', 'Spot size', 'Optical', 'number', 'length', 'µm', ['laser_head', 'f_theta'], { aliases: ['spot size', 'spot'], min: 0 });
S('nozzle', 'Nozzle', 'Process', 'text', 'none', undefined, ['laser_head']);
S('gas', 'Process gas', 'Process', 'text', 'none', undefined, ['laser_head']);
S('sensors', 'Integrated sensors', 'Process', 'text', 'none', undefined, ['laser_head']);
S('camera_port', 'Camera port', 'Process', 'boolean', 'none', undefined, ['laser_head', 'galvo']);
// Chiller (§22)
S('cooling_capacity', 'Cooling capacity', 'Thermal', 'number', 'power', 'W', ['chiller'], { aliases: ['cooling capacity', 'capacity'], min: 0 });
S('setpoint_range', 'Temperature set-point range', 'Thermal', 'range', 'temperature', '°C', ['chiller']);
S('temperature_stability', 'Temperature stability (±)', 'Thermal', 'number', 'temperature', '°C', ['chiller'], { min: 0 });
S('flow_rate', 'Flow rate', 'Fluid', 'number', 'flow', 'L/min', ['chiller', 'valve', 'vacuum_generator'], { min: 0 });
S('pressure', 'Pressure', 'Fluid', 'number', 'pressure', 'bar', ['chiller', 'valve', 'regulator', 'cylinder'], { min: 0 });
S('reservoir', 'Reservoir volume', 'Fluid', 'number', 'volume', 'L', ['chiller'], { min: 0 });
S('alarm', 'Alarm outputs', 'I/O', 'text', 'none', undefined, ['chiller', 'fume_extraction']);
// Fume extraction (§23)
S('airflow', 'Airflow', 'Fluid', 'number', 'flow', 'm³/h', ['fume_extraction'], { aliases: ['airflow'], min: 0 });
S('vacuum', 'Vacuum / static pressure', 'Fluid', 'number', 'pressure', 'Pa', ['fume_extraction', 'vacuum_generator'], { min: 0 });
S('filter_type', 'Filter type', 'Filtration', 'text', 'none', undefined, ['fume_extraction']);
S('filter_efficiency', 'Filter efficiency', 'Filtration', 'number', 'dimensionless', '%', ['fume_extraction'], { min: 0, max: 100 });
S('particle_size', 'Particle size (rated)', 'Filtration', 'number', 'length', 'µm', ['fume_extraction'], { min: 0 });
S('motor_power', 'Motor power', 'Electrical', 'number', 'power', 'W', ['fume_extraction', 'conveyor'], { min: 0 });
S('noise', 'Noise', 'Environment', 'number', 'sound', 'dB(A)', ['fume_extraction', 'chiller'], { min: 0 });
S('duct_diameter', 'Duct diameter', 'Mechanical', 'number', 'length', 'mm', ['fume_extraction'], { min: 0 });
S('filter_life', 'Filter life', 'Life', 'number', 'time', 'h', ['fume_extraction'], { min: 0 });
// Camera (§24)
S('sensor_type', 'Sensor type', 'Sensor', 'text', 'none', undefined, ['camera']);
S('sensor_format', 'Sensor format (as published)', 'Sensor', 'text', 'none', undefined, ['camera', 'vision_lens', 'telecentric_lens']);
S('sensor_diagonal', 'Sensor diagonal', 'Sensor', 'number', 'length', 'mm', ['camera'], { aliases: ['sensor size', 'sensor diagonal'], min: 0 });
S('resolution_x', 'Resolution X', 'Sensor', 'number', 'count', 'px', ['camera'], { min: 0 });
S('resolution_y', 'Resolution Y', 'Sensor', 'number', 'count', 'px', ['camera'], { min: 0 });
S('megapixel', 'Resolution (MP)', 'Sensor', 'number', 'count', 'MP', ['camera'], { aliases: ['mp', 'megapixel', 'resolution'], min: 0 });
S('pixel_size', 'Pixel size', 'Sensor', 'number', 'length', 'µm', ['camera'], { aliases: ['pixel size'], min: 0 });
S('frame_rate', 'Frame rate', 'Sensor', 'number', 'frequency', 'fps', ['camera'], { aliases: ['fps', 'frame rate'], min: 0 });
S('shutter', 'Shutter', 'Sensor', 'enum', 'none', undefined, ['camera'], { enum: ['Global', 'Rolling'], aliases: ['global shutter', 'rolling shutter', 'shutter'] });
S('dynamic_range', 'Dynamic range', 'Sensor', 'number', 'sound', 'dB', ['camera'], { min: 0 });
S('bit_depth', 'Bit depth', 'Sensor', 'text', 'none', undefined, ['camera']);
S('lens_mount', 'Lens mount', 'Mechanical', 'enum', 'none', undefined, ['camera', 'vision_lens', 'telecentric_lens'], { enum: ['C', 'CS', 'F', 'M42', 'M58', 'S (M12)', 'Other'], aliases: ['mount'] });
S('gpio', 'GPIO', 'I/O', 'text', 'none', undefined, ['camera', 'vision_controller']);
// Vision lens (§25), lighting (§26)
S('f_number', 'Aperture (f-number)', 'Optical', 'text', 'none', undefined, ['vision_lens', 'telecentric_lens']);
S('max_sensor_diagonal', 'Maximum sensor diagonal (image circle)', 'Optical', 'number', 'length', 'mm', ['vision_lens', 'telecentric_lens'], { aliases: ['image circle', 'max sensor'], min: 0 });
S('field_of_view', 'Field of view', 'Optical', 'text', 'none', undefined, ['vision_lens', 'telecentric_lens', 'camera']);
S('optical_resolution', 'Optical resolution', 'Optical', 'text', 'none', undefined, ['vision_lens', 'telecentric_lens']);
S('coaxial', 'Coaxial illumination port', 'Optical', 'boolean', 'none', undefined, ['telecentric_lens', 'vision_lens']);
S('light_type', 'Light type', 'Lighting', 'enum', 'none', undefined, ['lighting'], { enum: ['Ring', 'Bar', 'Backlight', 'Dome', 'Coaxial', 'Line', 'Spot', 'UV', 'IR'] });
S('color', 'Colour', 'Lighting', 'text', 'none', undefined, ['lighting']);
S('intensity', 'Intensity', 'Lighting', 'number', 'illuminance', 'lx', ['lighting'], { min: 0 });
S('strobe', 'Strobe capable', 'Lighting', 'boolean', 'none', undefined, ['lighting']);
// Motion (§27), robot (§28)
S('travel', 'Travel / stroke', 'Motion', 'number', 'length', 'mm', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'cylinder'], { aliases: ['travel', 'stroke'], min: 0 });
S('payload', 'Payload', 'Motion', 'number', 'mass', 'kg', ['linear_stage', 'ball_screw_stage', 'rotary_stage', 'robot', 'gripper'], { aliases: ['payload', 'load'], min: 0 });
S('max_speed', 'Maximum speed', 'Motion', 'number', 'speed', 'mm/s', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'robot', 'conveyor'], { aliases: ['speed', 'velocity'], min: 0 });
S('acceleration', 'Acceleration', 'Motion', 'number', 'acceleration', 'm/s²', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'robot'], { min: 0 });
S('positioning_accuracy', 'Accuracy', 'Motion', 'number', 'length', 'µm', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'robot', 'rotary_stage'], { aliases: ['accuracy'], min: 0 });
S('positioning_repeatability', 'Repeatability', 'Motion', 'number', 'length', 'µm', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'robot', 'rotary_stage'], { aliases: ['repeatability'], min: 0 });
S('resolution', 'Resolution', 'Motion', 'number', 'length', 'µm', ['linear_stage', 'ball_screw_stage', 'linear_motor', 'encoder'], { min: 0 });
S('backlash', 'Backlash', 'Motion', 'number', 'angle', 'arcmin', ['gearbox', 'rotary_stage'], { min: 0 });
S('rated_power', 'Rated power', 'Electrical', 'number', 'power', 'W', ['servo_motor', 'servo_drive', 'linear_motor', 'smps'], { aliases: ['motor power', 'rated power'], min: 0 });
S('rated_torque', 'Rated torque', 'Motion', 'number', 'torque', 'N·m', ['servo_motor', 'gearbox'], { min: 0 });
S('peak_torque', 'Peak torque', 'Motion', 'number', 'torque', 'N·m', ['servo_motor'], { min: 0 });
S('rated_speed', 'Rated speed', 'Motion', 'number', 'frequency', 'rpm', ['servo_motor'], { min: 0 });
S('rotor_inertia', 'Rotor inertia', 'Motion', 'number', 'inertia', 'kg·cm²', ['servo_motor'], { min: 0 });
S('rated_current', 'Rated current', 'Electrical', 'number', 'current', 'A', ['servo_motor', 'servo_drive', 'contactor', 'circuit_breaker'], { min: 0 });
S('duty_cycle', 'Duty cycle', 'Motion', 'number', 'dimensionless', '%', ['servo_motor', 'linear_motor'], { min: 0, max: 100 });
S('gear_ratio', 'Gear ratio', 'Motion', 'number', 'none', undefined, ['gearbox']);
S('reach', 'Reach', 'Robot', 'number', 'length', 'mm', ['robot'], { aliases: ['reach'], min: 0 });
S('axes', 'Axes', 'Robot', 'number', 'none', undefined, ['robot', 'motion_controller', 'plc'], { min: 0 });
S('workspace', 'Workspace', 'Robot', 'text', 'none', undefined, ['robot']);
S('mounting', 'Mounting', 'Mechanical', 'text', 'none', undefined, MECH_ALL);
S('ip_rating', 'IP rating', 'Environment', 'text', 'none', undefined, MECH_ALL, { aliases: ['ip rating', 'ip'] });
// PLC (§29), HMI / IPC (§30)
S('cpu', 'CPU', 'Compute', 'text', 'none', undefined, ['plc', 'hmi', 'ipc', 'vision_controller']);
S('scan_time', 'Scan time (1 k instructions)', 'Compute', 'number', 'time', 'ms', ['plc'], { min: 0 });
S('program_memory', 'Program memory', 'Compute', 'number', 'data', 'MB', ['plc'], { min: 0 });
S('data_memory', 'Data memory', 'Compute', 'number', 'data', 'MB', ['plc'], { min: 0 });
S('digital_inputs', 'Digital inputs', 'I/O', 'number', 'none', undefined, ['plc', 'safety_plc'], { min: 0 });
S('digital_outputs', 'Digital outputs', 'I/O', 'number', 'none', undefined, ['plc', 'safety_plc'], { min: 0 });
S('analog_inputs', 'Analog inputs', 'I/O', 'number', 'none', undefined, ['plc'], { min: 0 });
S('analog_outputs', 'Analog outputs', 'I/O', 'number', 'none', undefined, ['plc'], { min: 0 });
S('motion_axes', 'Motion axes', 'Compute', 'number', 'none', undefined, ['plc', 'motion_controller'], { min: 0 });
S('expansion', 'Expansion', 'I/O', 'text', 'none', undefined, ['plc']);
S('screen_size', 'Screen size', 'Display', 'number', 'length', 'inch', ['hmi', 'ipc'], { min: 0 });
S('display_resolution', 'Display resolution', 'Display', 'text', 'none', undefined, ['hmi', 'ipc']);
S('touch', 'Touch', 'Display', 'text', 'none', undefined, ['hmi']);
S('ram', 'RAM', 'Compute', 'number', 'data', 'GB', ['hmi', 'ipc', 'vision_controller'], { min: 0 });
S('storage', 'Storage', 'Compute', 'number', 'data', 'GB', ['hmi', 'ipc', 'vision_controller'], { min: 0 });
S('os', 'Operating system', 'Compute', 'text', 'none', undefined, ['hmi', 'ipc', 'vision_controller']);
S('gpu', 'GPU', 'Compute', 'text', 'none', undefined, ['ipc', 'vision_controller']);
// Sensors (§31), safety (§32)
S('sensor_category', 'Sensor category', 'Sensor', 'enum', 'none', undefined, ['sensor'], { enum: ['Proximity', 'Photoelectric', 'Laser displacement', 'Pressure', 'Temperature', 'Flow', 'Force', 'Torque', 'Encoder', 'Vibration', 'Safety'] });
S('sensing_range', 'Sensing range', 'Sensor', 'number', 'length', 'mm', ['sensor'], { min: 0 });
S('response_time', 'Response time', 'Sensor', 'number', 'time', 'ms', ['sensor', 'light_curtain', 'safety_scanner', 'safety_relay', 'safety_plc', 'valve'], { min: 0 });
S('output_type', 'Output type', 'I/O', 'text', 'none', undefined, ['sensor']);
S('performance_level', 'Performance level (ISO 13849)', 'Safety', 'enum', 'none', undefined, ['safety_plc', 'safety_relay', 'light_curtain', 'safety_scanner', 'door_switch', 'safety_controller', 'emergency_stop'], { enum: ['a', 'b', 'c', 'd', 'e'], desc: 'Only from the manufacturer’s declaration — never inferred.' });
S('sil', 'SIL (IEC 62061)', 'Safety', 'enum', 'none', undefined, ['safety_plc', 'safety_relay', 'light_curtain', 'safety_scanner', 'safety_controller'], { enum: ['1', '2', '3'], desc: 'Only from the manufacturer’s declaration — never inferred.' });
S('protective_range', 'Protective range / height', 'Safety', 'number', 'length', 'mm', ['light_curtain', 'safety_scanner'], { min: 0 });
S('detection_resolution', 'Detection resolution', 'Safety', 'number', 'length', 'mm', ['light_curtain', 'safety_scanner'], { min: 0 });
S('monitoring', 'Monitoring', 'Safety', 'text', 'none', undefined, ['safety_relay', 'safety_plc', 'door_switch']);
// Pneumatics (§33), electrical (§34), mechanical (§35)
S('bore', 'Bore', 'Pneumatic', 'number', 'length', 'mm', ['cylinder'], { min: 0 });
S('force', 'Force', 'Pneumatic', 'number', 'force', 'N', ['cylinder', 'gripper'], { min: 0 });
S('port', 'Port', 'Pneumatic', 'text', 'none', undefined, ['cylinder', 'valve', 'regulator']);
S('rated_voltage', 'Rated voltage', 'Electrical', 'number', 'voltage', 'V', ['smps', 'circuit_breaker', 'contactor', 'ups', 'cable'], { min: 0 });
S('output_power', 'Output power', 'Electrical', 'number', 'power', 'W', ['smps', 'ups'], { min: 0 });
S('supply_frequency', 'Supply frequency', 'Electrical', 'number', 'frequency', 'Hz', ['smps', 'ups', 'chiller'], { min: 0 });
S('breaking_capacity', 'Breaking capacity', 'Electrical', 'number', 'current', 'kA', ['circuit_breaker'], { min: 0 });
S('load_capacity', 'Load capacity', 'Mechanical', 'number', 'force', 'N', ['frame', 'guide_rail', 'fixture', 'conveyor'], { min: 0 });
S('tolerance', 'Tolerance', 'Mechanical', 'text', 'none', undefined, ['frame', 'fixture', 'guide_rail']);
S('surface_finish', 'Surface finish', 'Mechanical', 'text', 'none', undefined, ['frame', 'fixture', 'enclosure']);
S('manufacturing_process', 'Manufacturing process', 'Mechanical', 'text', 'none', undefined, ['frame', 'fixture', 'enclosure']);
S('width_range', 'Width range', 'Mechanical', 'range', 'length', 'mm', ['conveyor', 'fixture'], { min: 0 });
S('laser_class', 'Laser safety class of the enclosure (declared)', 'Safety', 'text', 'none', undefined, ['enclosure'], { desc: 'Only a declared class — never inferred.' });

/* ------------------------------------------------------------ compatibility rules */

const rule = (id: string, name: string, r: Record<string, unknown>) => ({
  id: `cpr-${id}`,
  entity: 'compatibility_rule',
  name,
  rule_version: 1,
  rule_status: 'Active',
  data_type: 'TEAL_INTERNAL',
  provenance: { source_id: SRC, verification_status: 'DRAFT', note: 'Engineering rule written from the master prompt §44 examples. A rule result is an engineering inference, never a manufacturer confirmation. Review before relying on it.' },
  ...r,
});
const OPT_WL = ['mirror', 'lens', 'window', 'collimator', 'polarizer', 'waveplate', 'filter', 'dichroic', 'isolator', 'beam_delivery', 'laser_head'];
const rules = [
  rule('laser-galvo-wavelength', 'Laser wavelength within galvo mirror coating range', { a_types: LASERS, b_types: ['galvo'], check: 'range_contains', a_spec: 'wavelength', b_spec: 'wavelength_range', on_fail: 'Incompatible', explanation: 'IF laser wavelength = X THEN the scanner mirror coating range must contain X (reflectivity and damage threshold are specified only inside the coating band).' }),
  rule('laser-ftheta-wavelength', 'Laser wavelength within f-theta design range', { a_types: LASERS, b_types: ['f_theta'], check: 'range_contains', a_spec: 'wavelength', b_spec: 'wavelength_range', on_fail: 'Incompatible', explanation: 'IF laser wavelength = X THEN the f-theta design / coating range must contain X (focus position, field distortion and transmission are specified only inside it).' }),
  rule('laser-expander-wavelength', 'Laser wavelength within beam-expander range', { a_types: LASERS, b_types: ['beam_expander'], check: 'range_contains', a_spec: 'wavelength', b_spec: 'wavelength_range', on_fail: 'Incompatible', explanation: 'IF laser wavelength = X THEN the beam-expander coating range must contain X.' }),
  rule('laser-optic-wavelength', 'Laser wavelength within optic coating range', { a_types: LASERS, b_types: OPT_WL, check: 'range_contains', a_spec: 'wavelength', b_spec: 'wavelength_range', on_fail: 'Incompatible', explanation: 'IF laser wavelength = X THEN the optic coating range must contain X.' }),
  rule('laser-galvo-power', 'Laser power within galvo rating', { a_types: LASERS, b_types: ['galvo'], check: 'a_lte_b', a_spec: 'average_power', b_spec: 'max_power', on_fail: 'Incompatible', explanation: 'IF laser power > scanner rated power THEN incompatible (mirror heating and coating damage).' }),
  rule('laser-ftheta-power', 'Laser power within f-theta rating', { a_types: LASERS, b_types: ['f_theta'], check: 'a_lte_b', a_spec: 'average_power', b_spec: 'max_power', on_fail: 'Incompatible', explanation: 'IF laser power > lens rated power THEN incompatible (thermal lensing, coating damage).' }),
  rule('laser-head-power', 'Laser power within head rating', { a_types: LASERS, b_types: ['laser_head', 'beam_delivery', 'fiber'], check: 'a_lte_b', a_spec: 'average_power', b_spec: 'max_power', on_fail: 'Incompatible', explanation: 'IF laser power > head / delivery rated power THEN incompatible.' }),
  rule('expander-galvo-aperture', 'Expanded beam fits the galvo aperture (10 % margin)', { a_types: ['beam_expander'], b_types: ['galvo'], check: 'a_lte_b', a_spec: 'output_beam_diameter', b_spec: 'aperture', factor: 1.1, on_fail: 'ConditionallyCompatible', explanation: 'Output beam × 1.1 ≤ scanner aperture, otherwise the beam clips on the mirrors. Check with the 1/e² diameter at your laser’s actual beam size.' }),
  rule('laser-galvo-aperture', 'Raw beam fits the galvo aperture (10 % margin)', { a_types: LASERS, b_types: ['galvo'], check: 'a_lte_b', a_spec: 'beam_diameter', b_spec: 'aperture', factor: 1.1, on_fail: 'ConditionallyCompatible', explanation: 'Without an expander, raw beam × 1.1 ≤ scanner aperture.' }),
  rule('galvo-ftheta-aperture', 'Galvo aperture matches f-theta entrance beam', { a_types: ['galvo'], b_types: ['f_theta'], check: 'a_lte_b', a_spec: 'aperture', b_spec: 'entrance_beam_diameter', on_fail: 'ConditionallyCompatible', explanation: 'A scanner aperture larger than the lens entrance beam specification can pass a beam the lens is not designed for. Confirm the actual beam diameter at the lens.' }),
  rule('laser-chiller-capacity', 'Chiller capacity covers the laser heat load', { a_types: [...LASERS, 'laser_head'], b_types: ['chiller'], check: 'a_lte_b', a_spec: 'heat_load', b_spec: 'cooling_capacity', on_fail: 'Incompatible', explanation: 'IF heat load > chiller cooling capacity THEN incompatible. Add margin for ambient and set-point.' }),
  rule('camera-lens-sensor', 'Lens image circle covers the camera sensor', { a_types: ['camera'], b_types: ['vision_lens', 'telecentric_lens'], check: 'a_lte_b', a_spec: 'sensor_diagonal', b_spec: 'max_sensor_diagonal', on_fail: 'Incompatible', explanation: 'IF camera sensor size > lens supported sensor size THEN incompatible (vignetting at the corners).' }),
  rule('camera-lens-mount', 'Camera and lens mount match', { a_types: ['camera'], b_types: ['vision_lens', 'telecentric_lens'], check: 'text_equals', a_spec: 'lens_mount', b_spec: 'lens_mount', on_fail: 'Incompatible', explanation: 'Camera and lens mounts must match. Some combinations (C lens on CS camera) work with an adapter ring — record that as a conditional relationship with evidence.' }),
  rule('camera-controller-protocol', 'Camera and vision controller share an interface', { a_types: ['camera'], b_types: ['vision_controller', 'ipc'], check: 'shared_protocol', a_spec: 'communication', b_spec: 'communication', on_fail: 'Incompatible', explanation: 'The camera interface (GigE Vision, USB3 Vision, CoaXPress …) must be supported by the controller.' }),
  rule('plc-drive-protocol', 'Controller and servo drive share a fieldbus', { a_types: ['plc', 'motion_controller'], b_types: ['servo_drive'], check: 'shared_protocol', a_spec: 'communication', b_spec: 'communication', on_fail: 'Incompatible', explanation: 'IF the drive needs EtherCAT / PROFINET / EtherNet-IP THEN the selected controller must support it.' }),
  rule('drive-motor-power', 'Servo drive rating covers the motor', { a_types: ['servo_drive'], b_types: ['servo_motor'], check: 'a_gte_b', a_spec: 'rated_power', b_spec: 'rated_power', on_fail: 'Incompatible', explanation: 'IF motor rated power > drive rated power THEN incompatible. Confirm the manufacturer’s drive/motor pairing table as well.' }),
  rule('galvo-controller-protocol', 'Scanner and controller share a command protocol', { a_types: ['galvo'], b_types: ['galvo_controller'], check: 'shared_protocol', a_spec: 'communication', b_spec: 'communication', on_fail: 'Incompatible', explanation: 'Scanner command protocol (XY2-100, SL2-100 …) must be supported by the controller.' }),
  rule('laser-controller-protocol', 'Laser and controller share a control interface', { a_types: LASERS, b_types: ['galvo_controller', 'laser_controller'], check: 'shared_protocol', a_spec: 'communication', b_spec: 'communication', on_fail: 'Incompatible', explanation: 'The laser control interface (DB25, RS232, Ethernet …) must be supported by the controller.' }),
  rule('robot-gripper-payload', 'Gripper weight within robot payload', { a_types: ['gripper', 'end_effector'], b_types: ['robot'], check: 'a_lte_b', a_spec: 'weight', b_spec: 'payload', on_fail: 'Incompatible', explanation: 'Tool weight (plus part weight) must stay within the robot payload at the tool’s centre of gravity.' }),
];

/* ------------------------------------------------------------ equipment templates */

type St = Record<string, unknown>;
const st = (key: string, name: string, kind: string, o: St = {}): St => ({ key, name, kind, time_s: null, parallel: 1, buffer_after: 0, ...o });
const slot = (role: string, product_type: string, required = true, quantity?: number) => ({ role, product_type, required, ...(quantity ? { quantity } : {}) });
const LOAD = (name = 'Loading', o: St = {}) => st('load', name, 'load', { function: 'Bring the part into the machine', ...o });
const UNLOAD = (name = 'Unloading', o: St = {}) => st('unload', name, 'unload', { function: 'Remove the finished part', ...o });
const FIX = (name = 'Fixture / clamp', o: St = {}) => st('fixture', name, 'fixture', { function: 'Locate and hold the part', slots: [slot('Fixture', 'fixture'), slot('Clamp cylinder', 'cylinder', false)], ...o });
const ALIGN = (name = 'Vision alignment', o: St = {}) => st('align', name, 'align', { function: 'Find fiducials / part position', slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens'), slot('Lighting', 'lighting', false)], ...o });
const INSPECT = (name = 'Inspection', o: St = {}) => st('inspect', name, 'inspect', { function: 'Check the result against the quality criteria', slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens'), slot('Lighting', 'lighting', false)], ...o });
const SORT = (name = 'OK / NG sorting', o: St = {}) => st('sort', name, 'sort', { function: 'Separate rejected parts', ...o });
const GALVO_LASER = (name: string, o: St = {}) =>
  st('laser', name, 'laser', {
    function: 'Laser process',
    laser: {},
    slots: [slot('Laser source', 'laser_source'), slot('Beam expander', 'beam_expander', false), slot('Galvo scanner', 'galvo'), slot('F-theta lens', 'f_theta'), slot('Galvo controller', 'galvo_controller', false), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)],
    ...o,
  });
const HEAD_LASER = (name: string, o: St = {}) =>
  st('laser', name, 'laser', {
    function: 'Laser process with a processing head and motion',
    laser: {},
    slots: [slot('Laser source', 'laser_source'), slot('Processing head', 'laser_head'), slot('Motion axis', 'linear_stage'), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)],
    ...o,
  });
const PROC = (key: string, name: string, kind = 'process', o: St = {}) => st(key, name, kind, o);

const tpl = (code: string, name: string, group: string, application: string, stations: St[], o: St = {}) => ({
  id: `eqt-${code}`,
  entity: 'equipment_template',
  name,
  code: code.toUpperCase(),
  group,
  application,
  stations,
  data_type: 'TEAL_INTERNAL',
  provenance: { source_id: SRC, verification_status: 'SOURCE_DOCUMENTED', note: 'Equipment structure from the master prompt (§60, §61). Station times, capacities and costs are deliberately empty — enter them per scenario with their basis.' },
  ...o,
});

const templates = [
  // LASER
  tpl('laser-marking', 'Laser Marking', 'Laser', 'Laser marking', [LOAD(), FIX(), ALIGN(), GALVO_LASER('Laser marking'), INSPECT('Mark verification'), SORT(), UNLOAD()], { domain_id: 'dom-laser', process: 'Marking', has_laser_chain: true, product_id: 'prd-markf' }),
  tpl('laser-etching', 'Laser Etching', 'Laser', 'Laser etching / deep engraving', [LOAD(), FIX(), GALVO_LASER('Laser etching (multi-pass)'), INSPECT('Depth / appearance check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Engraving', has_laser_chain: true }),
  tpl('laser-welding', 'Laser Welding', 'Laser', 'Laser welding', [LOAD(), FIX('Clamp / joint fit-up'), ALIGN('Seam finding'), HEAD_LASER('Laser welding'), INSPECT('Weld inspection'), SORT(), UNLOAD()], { domain_id: 'dom-laser', process: 'Welding', has_laser_chain: true }),
  tpl('laser-cutting', 'Laser Cutting', 'Laser', 'Laser cutting', [LOAD(), FIX('Nest / hold-down'), HEAD_LASER('Laser cutting'), INSPECT('Kerf / edge check'), UNLOAD('Part and skeleton removal')], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true }),
  tpl('laser-cleaning', 'Laser Cleaning', 'Laser', 'Laser cleaning / surface preparation', [LOAD(), FIX(), GALVO_LASER('Laser cleaning'), INSPECT('Surface check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Cleaning', has_laser_chain: true }),
  tpl('laser-drilling', 'Laser Drilling', 'Laser', 'Laser drilling', [LOAD(), FIX(), ALIGN(), GALVO_LASER('Laser drilling'), INSPECT('Hole inspection'), UNLOAD()], { domain_id: 'dom-laser', process: 'Drilling', has_laser_chain: true }),
  tpl('laser-scribing', 'Laser Scribing', 'Laser', 'Laser scribing', [LOAD(), FIX('Vacuum chuck'), ALIGN(), HEAD_LASER('Laser scribing'), INSPECT('Scribe inspection'), UNLOAD()], { domain_id: 'dom-laser', process: 'Scribing', has_laser_chain: true }),
  tpl('pcb-laser-marking', 'PCB Laser Marking (inline)', 'Laser', 'PCB 2D code / serial marking', [LOAD('Board in (conveyor)', { slots: [slot('Conveyor', 'conveyor')] }), FIX('Board stop & clamp'), ALIGN('Fiducial alignment'), GALVO_LASER('Laser marking'), INSPECT('Code verification (grade)'), SORT(), UNLOAD('Board out (conveyor)')], { domain_id: 'dom-electronics', process: 'Marking', has_laser_chain: true, product_id: 'prd-markc2i' }),
  tpl('battery-tab-welding', 'Battery Tab Welding', 'Laser', 'Battery tab / busbar laser welding', [LOAD('Module / cell load'), FIX('Clamp & tab pressing'), ALIGN('Tab position vision'), HEAD_LASER('Laser tab welding'), INSPECT('Weld seam inspection'), SORT(), UNLOAD()], { domain_id: 'dom-battery', process: 'Welding', has_laser_chain: true, product_id: 'prd-weldb' }),
  tpl('semiconductor-marking', 'Semiconductor Package Marking', 'Laser', 'Package / strip marking', [LOAD('Magazine / strip loading'), FIX('Strip clamp'), ALIGN('Strip alignment'), GALVO_LASER('Laser marking'), INSPECT('Mark inspection (OCR / 2D)'), SORT('Reject mapping'), UNLOAD('Strip unloading')], { domain_id: 'dom-semiconductor', process: 'Marking', has_laser_chain: true, product_id: 'prd-semispm' }),
  // ELECTRONICS
  tpl('pcb-marking', 'PCB Marking', 'Electronics', 'PCB identification marking', [LOAD('Board in', { slots: [slot('Conveyor', 'conveyor')] }), FIX('Board stop'), GALVO_LASER('Marking'), INSPECT('Code read-back'), UNLOAD('Board out')], { domain_id: 'dom-electronics', process: 'Marking', has_laser_chain: true }),
  tpl('pcb-inspection', 'PCB Inspection', 'Electronics', 'PCB optical inspection', [LOAD('Board in'), INSPECT('Optical inspection'), SORT(), UNLOAD('Board out')], { domain_id: 'dom-electronics', process: 'Inspection' }),
  tpl('electronics-assembly', 'Electronics Assembly', 'Electronics', 'Component / sub-assembly', [LOAD(), FIX(), PROC('assembly', 'Pick & place / press-fit', 'assembly', { slots: [slot('Robot', 'robot', false), slot('Gripper', 'gripper', false)] }), INSPECT(), UNLOAD()], { domain_id: 'dom-electronics', process: 'Assembly' }),
  tpl('electronics-testing', 'Electronics Testing', 'Electronics', 'Functional / ICT test', [LOAD(), FIX('Test fixture (bed of nails)'), PROC('test', 'Functional test', 'test'), SORT(), UNLOAD()], { domain_id: 'dom-electronics', process: 'Testing' }),
  tpl('traceability', 'Traceability Station', 'Electronics', 'Serialisation, read-back and MES booking', [LOAD(), PROC('read', 'Code read / mark', 'vision', { slots: [slot('Camera', 'camera')] }), PROC('mes', 'MES booking', 'process'), UNLOAD()], { domain_id: 'dom-electronics', process: 'Traceability' }),
  // SEMICONDUCTOR
  tpl('wafer-handling', 'Wafer Handling', 'Semiconductor', 'Wafer transfer (load port → aligner → station)', [LOAD('Load port'), PROC('prealign', 'Pre-aligner', 'align'), PROC('transfer', 'Wafer transfer robot', 'transfer', { slots: [slot('Wafer robot', 'robot')] }), UNLOAD('Load port (out)')], { domain_id: 'dom-semiconductor', process: 'Handling' }),
  tpl('wafer-marking', 'Wafer Marking', 'Semiconductor', 'Wafer ID marking', [LOAD('Load port'), PROC('prealign', 'Pre-align / notch find', 'align'), GALVO_LASER('Wafer ID marking'), INSPECT('ID read-back'), UNLOAD('Load port (out)')], { domain_id: 'dom-semiconductor', process: 'Marking', has_laser_chain: true, product_id: 'prd-semiwm' }),
  tpl('wafer-inspection', 'Wafer Inspection', 'Semiconductor', 'Wafer / die inspection', [LOAD('Load port'), PROC('prealign', 'Pre-align', 'align'), INSPECT('Optical inspection'), UNLOAD('Load port (out)')], { domain_id: 'dom-semiconductor', process: 'Inspection' }),
  tpl('dicing', 'Dicing', 'Semiconductor', 'Wafer dicing', [LOAD('Frame load'), ALIGN('Street alignment'), HEAD_LASER('Dicing (laser)'), PROC('clean', 'Clean / dry', 'process'), INSPECT('Kerf inspection'), UNLOAD('Frame unload')], { domain_id: 'dom-semiconductor', process: 'Dicing', has_laser_chain: true, product_id: 'prd-semidc' }),
  tpl('die-attach', 'Die Attach', 'Semiconductor', 'Die attach', [LOAD('Substrate load'), PROC('dispense', 'Adhesive dispense', 'process'), PROC('pick', 'Die pick', 'transfer'), PROC('bond', 'Die bond / place', 'assembly'), INSPECT('Placement inspection'), UNLOAD()], { domain_id: 'dom-semiconductor', process: 'Die attach' }),
  tpl('packaging', 'Packaging (back-end)', 'Semiconductor', 'Package assembly step', [LOAD(), PROC('process', 'Packaging process', 'process'), INSPECT(), UNLOAD()], { domain_id: 'dom-semiconductor', process: 'Packaging' }),
  tpl('metrology', 'Metrology', 'Semiconductor', 'Dimensional / film metrology', [LOAD('Load port'), PROC('measure', 'Measurement', 'inspect'), UNLOAD('Load port (out)')], { domain_id: 'dom-semiconductor', process: 'Metrology' }),
  // BATTERY
  tpl('cell-inspection', 'Cell Inspection', 'Battery', 'Cell dimensional / visual inspection', [LOAD('Cell infeed'), INSPECT('Dimensional & visual inspection'), PROC('ocv', 'OCV / IR check', 'test'), SORT(), UNLOAD()], { domain_id: 'dom-battery', process: 'Inspection' }),
  tpl('battery-laser-cleaning', 'Battery Laser Cleaning', 'Battery', 'Pre-bond surface cleaning', [LOAD(), FIX(), GALVO_LASER('Laser cleaning'), INSPECT('Surface check'), UNLOAD()], { domain_id: 'dom-battery', process: 'Cleaning', has_laser_chain: true, product_id: 'prd-cleana' }),
  tpl('busbar-welding', 'Busbar Welding', 'Battery', 'Busbar laser welding', [LOAD('Module load'), FIX('Busbar clamp'), ALIGN(), HEAD_LASER('Busbar welding'), INSPECT('Weld inspection'), UNLOAD()], { domain_id: 'dom-battery', process: 'Welding', has_laser_chain: true }),
  tpl('can-marking', 'Can Marking', 'Battery', 'Cell can / cap marking', [LOAD('Cell infeed'), GALVO_LASER('Laser marking'), INSPECT('Code read-back'), UNLOAD()], { domain_id: 'dom-battery', process: 'Marking', has_laser_chain: true }),
  tpl('module-assembly', 'Module Assembly', 'Battery', 'Cell-to-module assembly', [LOAD('Cell stacking'), PROC('compress', 'Stack compression', 'assembly'), PROC('frame', 'Frame / end-plate assembly', 'assembly'), INSPECT(), UNLOAD()], { domain_id: 'dom-battery', process: 'Assembly' }),
  tpl('pack-assembly', 'Pack Assembly', 'Battery', 'Module-to-pack assembly', [LOAD(), PROC('place', 'Module placement', 'assembly'), PROC('fasten', 'Fastening / connection', 'assembly'), PROC('leak', 'Leak test', 'test'), PROC('eol', 'End-of-line test', 'test'), UNLOAD()], { domain_id: 'dom-battery', process: 'Assembly' }),
  // GENERAL AUTOMATION
  tpl('pick-place', 'Pick & Place', 'General Automation', 'Pick and place', [LOAD(), PROC('pick', 'Robot pick & place', 'transfer', { slots: [slot('Robot', 'robot'), slot('Gripper', 'gripper')] }), UNLOAD()], { domain_id: 'dom-automation', process: 'Handling' }),
  tpl('assembly', 'Assembly', 'General Automation', 'Mechanical assembly', [LOAD(), FIX(), PROC('assembly', 'Assembly operation', 'assembly'), INSPECT(), UNLOAD()], { domain_id: 'dom-automation', process: 'Assembly' }),
  tpl('screwdriving', 'Screwdriving', 'General Automation', 'Automatic screwdriving', [LOAD(), FIX(), PROC('screw', 'Screwdriving (torque/angle)', 'assembly'), UNLOAD()], { domain_id: 'dom-automation', process: 'Assembly' }),
  tpl('dispensing', 'Dispensing', 'General Automation', 'Adhesive / sealant dispensing', [LOAD(), FIX(), PROC('dispense', 'Dispensing', 'process'), INSPECT('Bead inspection'), UNLOAD()], { domain_id: 'dom-automation', process: 'Dispensing' }),
  tpl('pressing', 'Pressing', 'General Automation', 'Press-fit with force monitoring', [LOAD(), FIX(), PROC('press', 'Press-fit', 'assembly'), UNLOAD()], { domain_id: 'dom-automation', process: 'Assembly' }),
  tpl('testing', 'Testing', 'General Automation', 'Functional test', [LOAD(), FIX('Test fixture'), PROC('test', 'Test', 'test'), SORT(), UNLOAD()], { domain_id: 'dom-automation', process: 'Testing' }),
  tpl('packaging-line', 'Packaging', 'General Automation', 'Packing / cartoning', [LOAD(), PROC('pack', 'Pack', 'assembly'), PROC('label', 'Label & verify', 'vision'), UNLOAD()], { domain_id: 'dom-automation', process: 'Packaging' }),
];

/* ------------------------------------------------------------ DEMO data */

const DEMO_NOTE = 'DEMO DATA — fictional record for demonstration. Not a real manufacturer, product, specification or price.';
const demoProv = (source_id = 'src-demo-datasheets', extra: Record<string, unknown> = {}) => ({ source_id, verification_status: 'DRAFT', note: DEMO_NOTE, ...extra });
const DS = 'src-demo-datasheets';
const DIST = 'src-demo-distributor';

const demoSources = [
  { id: DS, entity: 'source', name: 'DEMO manufacturer datasheets (fictional)', kind: 'datasheet', source_type: 'Manufacturer', organization: 'DEMO manufacturers', retrieved_at: TODAY, last_verified: TODAY, next_review: '2027-09-27', data_type: 'DEMO', provenance: { verification_status: 'DRAFT', note: DEMO_NOTE }, tags: ['demo'] },
  { id: 'src-demo-appnote', entity: 'source', name: 'DEMO application note — scanner / laser pairing (fictional)', kind: 'datasheet', source_type: 'Manufacturer', organization: 'DEMO Scan Systems', retrieved_at: TODAY, last_verified: TODAY, data_type: 'DEMO', provenance: { verification_status: 'DRAFT', note: DEMO_NOTE }, tags: ['demo'] },
  { id: DIST, entity: 'source', name: 'DEMO distributor catalogue (fictional)', kind: 'web', source_type: 'Distributor', organization: 'DEMO Distribution', retrieved_at: '2025-01-15', last_verified: '2025-01-15', next_review: '2026-01-15', data_type: 'DEMO', provenance: { verification_status: 'DRAFT', note: `${DEMO_NOTE} Deliberately stale (last verified 2025-01-15) to exercise freshness checks.` }, tags: ['demo'] },
];

const mfr = (id: string, name: string, country: string, cats: string[], techs: string[]) => ({
  id: `co-demo-${id}`,
  entity: 'company',
  name,
  display_name: name,
  roles: ['manufacturer'],
  country,
  registry_categories: cats,
  technologies: techs,
  data_type: 'DEMO',
  provenance: demoProv(DS),
  tags: ['demo'],
});
const manufacturers = [
  mfr('photonics', 'DEMO Photonics Co.', 'Germany (DEMO)', ['Laser'], ['Pulsed fiber (MOPA)', 'UV DPSS', 'CW fiber', 'CO₂']),
  mfr('laser-india', 'DEMO Laser India', 'India (DEMO)', ['Laser'], ['Q-switched fiber']),
  mfr('scan', 'DEMO Scan Systems', 'Germany (DEMO)', ['Galvo', 'Optics'], ['Galvanometer scanners', 'Scan controllers']),
  mfr('optics', 'DEMO Optics Works', 'India (DEMO)', ['Optics'], ['F-theta lenses', 'Beam expanders']),
  mfr('vision', 'DEMO Vision Labs', 'Japan (DEMO)', ['Vision'], ['Area-scan cameras', 'Machine-vision lenses', 'Lighting', 'Vision controllers']),
  mfr('motion', 'DEMO Motion Drives', 'India (DEMO)', ['Motion'], ['Servo motors', 'Servo drives', 'Linear stages']),
  mfr('controls', 'DEMO Controls Ltd', 'India (DEMO)', ['PLC', 'Automation'], ['PLC', 'HMI', 'Industrial PC']),
  mfr('safety', 'DEMO Safety Systems', 'Germany (DEMO)', ['Safety'], ['Safety PLC', 'Light curtains', 'Interlocks']),
  mfr('robotics', 'DEMO Robotics Inc.', 'Japan (DEMO)', ['Robotics'], ['SCARA robots', 'Grippers']),
  mfr('thermal', 'DEMO Thermal Systems', 'India (DEMO)', ['Laser'], ['Chillers', 'Fume extraction']),
  mfr('fab', 'DEMO Fabrication (local)', 'India (DEMO)', ['Automation'], ['Conveyors', 'Fixtures', 'Enclosures', 'Panels']),
];

type SpecIn = Record<string, unknown>;
const v = (spec: string, value: number, unit: string, o: SpecIn = {}): SpecIn => ({ spec, value, unit, original: `${value} ${unit}`, source_id: DS, evidence: 'DEMO datasheet, specifications table', confidence: 'LOW', extraction_status: 'USER_ENTERED', retrieved_at: TODAY, ...o });
const r = (spec: string, min: number, max: number, unit: string, o: SpecIn = {}): SpecIn => ({ spec, min, max, unit, original: `${min}–${max} ${unit}`, source_id: DS, evidence: 'DEMO datasheet, specifications table', confidence: 'LOW', extraction_status: 'USER_ENTERED', retrieved_at: TODAY, ...o });
const t = (spec: string, text: string, o: SpecIn = {}): SpecIn => ({ spec, text, original: text, source_id: DS, evidence: 'DEMO datasheet', confidence: 'LOW', extraction_status: 'USER_ENTERED', retrieved_at: TODAY, ...o });
const price = (p: number, currency: string, lead?: number) => [{ price: p, currency, basis: 'DEMO', date: TODAY, source_id: DS, ...(lead != null ? { lead_time_weeks: lead } : {}) }];

const part = (id: string, name: string, mf: string, model: string, type: string, specs: SpecIn[], o: Record<string, unknown> = {}) => ({
  id: `prt-demo-${id}`,
  entity: 'part',
  name,
  scope: 'GLOBAL',
  record_status: 'Reviewed',
  manufacturer_id: `co-demo-${mf}`,
  model_number: model,
  product_type: type,
  lifecycle_status: 'Active',
  specs,
  documents: [{ kind: 'Datasheet', title: `${model} datasheet (DEMO)`, source_id: DS }],
  data_type: 'DEMO',
  provenance: demoProv(),
  tags: ['demo'],
  ...o,
});

const mopa = (w: number, mj: number, m2v: number, heat: number, cons: number) => [
  v('wavelength', 1064, 'nm'),
  v('average_power', w, 'W'),
  r('pulse_width_range', 2, 350, 'ns'),
  r('repetition_rate_range', 1, 4000, 'kHz'),
  v('pulse_energy', mj, 'mJ'),
  v('m2', m2v, ''),
  v('beam_diameter', 7, 'mm'),
  t('cooling_method', 'Air'),
  v('heat_load', heat, 'W'),
  v('power_consumption', cons, 'W'),
  v('input_voltage', 24, 'V'),
  v('weight', 9, 'kg'),
  t('dimensions', '330 × 240 × 90 mm'),
];

const parts = [
  part('mopa-20', 'DEMO fiber MOPA laser 20 W', 'photonics', 'DL-MOPA-20', 'laser_source', mopa(20, 0.8, 1.4, 150, 200), { technologies: ['Fiber', 'MOPA', 'Nanosecond'], interfaces: { communication: ['DB25', 'RS232'] }, prices: price(3200, 'USD', 6), processes: ['Marking'] }),
  part('mopa-30', 'DEMO fiber MOPA laser 30 W', 'photonics', 'DL-MOPA-30', 'laser_source', mopa(30, 1.0, 1.4, 220, 280), { technologies: ['Fiber', 'MOPA', 'Nanosecond'], interfaces: { communication: ['DB25', 'RS232'] }, prices: price(4100, 'USD', 6), processes: ['Marking', 'Engraving'] }),
  part(
    'mopa-50',
    'DEMO fiber MOPA laser 50 W',
    'photonics',
    'DL-MOPA-50',
    'laser_source',
    [
      ...mopa(50, 1.5, 1.6, 350, 450).filter((s) => s.spec !== 'average_power'),
      v('average_power', 50, 'W', { evidence: 'DEMO datasheet, table 1' }),
      v('average_power', 48, 'W', { source_id: DIST, evidence: 'DEMO distributor catalogue listing', retrieved_at: '2025-01-15' }),
    ],
    { technologies: ['Fiber', 'MOPA', 'Nanosecond'], interfaces: { communication: ['DB25', 'RS232', 'Ethernet'] }, prices: price(6900, 'USD', 8), processes: ['Marking', 'Engraving', 'Cleaning'] },
  ),
  part('mopa-50-dist', 'DEMO fiber MOPA laser 50 W (distributor listing)', 'photonics', 'DL MOPA 50', 'laser_source', [v('wavelength', 1064, 'nm', { source_id: DIST, retrieved_at: '2025-01-15' }), v('average_power', 50, 'W', { source_id: DIST, retrieved_at: '2025-01-15' })], {
    record_status: 'Imported',
    technologies: ['Fiber', 'MOPA'],
    provenance: demoProv(DIST, { note: `${DEMO_NOTE} Imported from a distributor listing — a possible duplicate of DL-MOPA-50 for the review queue.` }),
    documents: [{ kind: 'Product Page', title: 'DEMO distributor listing', source_id: DIST }],
  }),
  part('qs-20-in', 'DEMO Q-switched fiber laser 20 W (local)', 'laser-india', 'LI-QS-20', 'laser_source', [v('wavelength', 1064, 'nm'), v('average_power', 20, 'W'), v('pulse_width', 100, 'ns'), r('repetition_rate_range', 20, 80, 'kHz'), v('pulse_energy', 1.0, 'mJ'), v('m2', 1.5, ''), v('beam_diameter', 7, 'mm'), t('cooling_method', 'Air'), v('heat_load', 160, 'W'), v('power_consumption', 220, 'W')], { technologies: ['Fiber', 'Q-switched', 'Nanosecond'], interfaces: { communication: ['DB25'] }, prices: price(190000, 'INR', 3), processes: ['Marking'] }),
  part('uv-5', 'DEMO UV DPSS laser 5 W', 'photonics', 'DL-UV-5', 'laser_source', [v('wavelength', 355, 'nm'), v('average_power', 5, 'W'), v('pulse_width', 20, 'ns'), r('repetition_rate_range', 20, 150, 'kHz'), v('m2', 1.2, ''), v('beam_diameter', 0.8, 'mm'), t('cooling_method', 'Water'), v('heat_load', 400, 'W'), v('power_consumption', 600, 'W')], { technologies: ['UV', 'DPSS', 'Nanosecond'], interfaces: { communication: ['DB25', 'RS232'] }, prices: price(9800, 'USD', 10), processes: ['Marking'] }),
  part('co2-30', 'DEMO CO₂ laser 30 W', 'photonics', 'DL-CO2-30', 'laser_source', [v('wavelength', 10.6, 'µm', { original: '10.6 µm' }), v('average_power', 30, 'W'), v('beam_diameter', 2.5, 'mm'), t('cooling_method', 'Air'), v('heat_load', 250, 'W'), v('power_consumption', 400, 'W')], { technologies: ['CO2'], interfaces: { communication: ['DB25'] }, prices: price(2500, 'USD', 6), processes: ['Marking', 'Cutting'] }),
  part('cw-1500', 'DEMO CW fiber laser 1.5 kW', 'photonics', 'DL-CW-1500', 'laser_source', [v('wavelength', 1070, 'nm'), v('average_power', 1500, 'W'), v('m2', 1.1, ''), t('cooling_method', 'Water'), v('heat_load', 3000, 'W'), v('power_consumption', 5000, 'W'), v('input_voltage', 415, 'V')], { technologies: ['Fiber', 'CW'], interfaces: { communication: ['EtherNet/IP', 'Modbus TCP', 'DB25'] }, prices: price(14000, 'USD', 10), processes: ['Welding', 'Cutting'] }),
  part('galvo-10', 'DEMO galvo scanner 10 mm', 'scan', 'SC-10', 'galvo', [v('aperture', 10, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('max_power', 100, 'W'), v('marking_speed', 3000, 'mm/s', { condition: 'with f = 160 mm' }), v('jump_speed', 8000, 'mm/s', { condition: 'with f = 160 mm' }), v('angular_repeatability', 8, 'µrad'), v('settling_time', 0.3, 'ms'), v('power_consumption', 60, 'W')], { interfaces: { communication: ['XY2-100'] }, prices: price(1100, 'USD', 4) }),
  part('galvo-14', 'DEMO galvo scanner 14 mm', 'scan', 'SC-14', 'galvo', [v('aperture', 14, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('max_power', 200, 'W'), v('marking_speed', 2500, 'mm/s', { condition: 'with f = 160 mm' }), v('jump_speed', 7000, 'mm/s', { condition: 'with f = 160 mm' }), v('angular_repeatability', 8, 'µrad'), v('settling_time', 0.35, 'ms'), v('power_consumption', 80, 'W')], { interfaces: { communication: ['XY2-100'] }, prices: price(1600, 'USD', 4) }),
  part('galvo-30', 'DEMO galvo scanner 30 mm (high power)', 'scan', 'SC-30HP', 'galvo', [v('aperture', 30, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('max_power', 2000, 'W'), v('marking_speed', 1500, 'mm/s', { condition: 'with f = 430 mm' }), v('angular_repeatability', 12, 'µrad'), t('cooling_method', 'Water'), v('heat_load', 150, 'W'), v('power_consumption', 150, 'W')], { interfaces: { communication: ['SL2-100', 'XY2-100'] }, prices: price(5200, 'USD', 8) }),
  part('galvo-10-uv', 'DEMO UV galvo scanner 10 mm', 'scan', 'SC-10-UV', 'galvo', [v('aperture', 10, 'mm'), r('wavelength_range', 343, 355, 'nm'), v('max_power', 20, 'W'), v('marking_speed', 2500, 'mm/s', { condition: 'with f = 160 mm' }), v('angular_repeatability', 8, 'µrad')], { interfaces: { communication: ['XY2-100'] }, prices: price(1900, 'USD', 6) }),
  part('galvo-ctrl', 'DEMO scan controller card', 'scan', 'SCC-2', 'galvo_controller', [v('power_consumption', 15, 'W')], { interfaces: { communication: ['XY2-100', 'DB25', 'Ethernet', 'USB'] }, prices: price(60000, 'INR', 4) }),
  part('ft-100', 'DEMO f-theta lens f100', 'optics', 'FT-1064-100', 'f_theta', [v('focal_length', 100, 'mm'), v('scan_field_x', 70, 'mm'), v('scan_field_y', 70, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('entrance_beam_diameter', 10, 'mm'), v('working_distance', 115, 'mm'), v('max_power', 100, 'W')], { prices: price(36000, 'INR', 3) }),
  part('ft-160', 'DEMO f-theta lens f160', 'optics', 'FT-1064-160', 'f_theta', [v('focal_length', 160, 'mm'), v('scan_field_x', 110, 'mm'), v('scan_field_y', 110, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('entrance_beam_diameter', 10, 'mm'), v('working_distance', 180, 'mm'), v('max_power', 100, 'W'), v('transmission', 98, '%')], { prices: price(42000, 'INR', 3) }),
  part('ft-254', 'DEMO f-theta lens f254', 'optics', 'FT-1064-254', 'f_theta', [v('focal_length', 254, 'mm'), v('scan_field_x', 175, 'mm'), v('scan_field_y', 175, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('entrance_beam_diameter', 14, 'mm'), v('working_distance', 290, 'mm'), v('max_power', 200, 'W')], { prices: price(58000, 'INR', 3) }),
  part('ft-uv-160', 'DEMO UV f-theta lens f160', 'optics', 'FT-355-160', 'f_theta', [v('focal_length', 160, 'mm'), v('scan_field_x', 110, 'mm'), v('scan_field_y', 110, 'mm'), r('wavelength_range', 343, 355, 'nm'), v('entrance_beam_diameter', 10, 'mm'), v('working_distance', 185, 'mm'), v('max_power', 20, 'W')], { prices: price(96000, 'INR', 5) }),
  part('ft-430-hp', 'DEMO high-power f-theta lens f430', 'optics', 'FT-1064-430HP', 'f_theta', [v('focal_length', 430, 'mm'), v('scan_field_x', 300, 'mm'), v('scan_field_y', 300, 'mm'), r('wavelength_range', 1030, 1090, 'nm'), v('entrance_beam_diameter', 30, 'mm'), v('working_distance', 500, 'mm'), v('max_power', 2000, 'W')], { prices: price(240000, 'INR', 8) }),
  part('bex-15x', 'DEMO beam expander 1.5×', 'optics', 'BE-1064-1.5X', 'beam_expander', [v('magnification', 1.5, ''), v('input_beam_diameter', 8, 'mm'), v('output_beam_diameter', 10.5, 'mm', { condition: 'at 7 mm input' }), r('wavelength_range', 1030, 1090, 'nm'), v('max_power', 100, 'W')], { prices: price(14000, 'INR', 3) }),
  part('bex-2x', 'DEMO beam expander 2×', 'optics', 'BE-1064-2X', 'beam_expander', [v('magnification', 2, ''), v('input_beam_diameter', 8, 'mm'), v('output_beam_diameter', 14, 'mm', { condition: 'at 7 mm input' }), r('wavelength_range', 1030, 1090, 'nm'), v('max_power', 100, 'W')], { prices: price(16000, 'INR', 3) }),
  part('bex-uv-3x', 'DEMO UV beam expander 3×', 'optics', 'BE-355-3X', 'beam_expander', [v('magnification', 3, ''), v('input_beam_diameter', 2, 'mm'), v('output_beam_diameter', 2.4, 'mm', { condition: 'at 0.8 mm input' }), r('wavelength_range', 343, 355, 'nm'), v('max_power', 20, 'W')], { prices: price(38000, 'INR', 5) }),
  part('cam-5mp', 'DEMO 5 MP global-shutter camera', 'vision', 'CV-5G', 'camera', [v('megapixel', 5, 'MP'), v('resolution_x', 2448, 'px'), v('resolution_y', 2048, 'px'), v('pixel_size', 3.45, 'µm'), t('sensor_format', '2/3"'), v('sensor_diagonal', 11.1, 'mm'), v('frame_rate', 24, 'fps'), t('shutter', 'Global'), t('lens_mount', 'C'), v('power_consumption', 4, 'W')], { interfaces: { communication: ['GigE Vision', 'Ethernet'] }, prices: price(68000, 'INR', 4) }),
  part('cam-12mp', 'DEMO 12 MP global-shutter camera', 'vision', 'CV-12G', 'camera', [v('megapixel', 12, 'MP'), v('resolution_x', 4096, 'px'), v('resolution_y', 3000, 'px'), v('pixel_size', 3.45, 'µm'), t('sensor_format', '1.1"'), v('sensor_diagonal', 17.6, 'mm'), v('frame_rate', 9, 'fps'), t('shutter', 'Global'), t('lens_mount', 'C'), v('power_consumption', 5, 'W')], { interfaces: { communication: ['GigE Vision', 'Ethernet'] }, prices: price(145000, 'INR', 6) }),
  part('cam-20mp-rs', 'DEMO 20 MP rolling-shutter camera', 'vision', 'CV-20R', 'camera', [v('megapixel', 20, 'MP'), v('resolution_x', 5472, 'px'), v('resolution_y', 3648, 'px'), v('pixel_size', 2.4, 'µm'), t('sensor_format', '1"'), v('sensor_diagonal', 15.9, 'mm'), v('frame_rate', 18, 'fps'), t('shutter', 'Rolling'), t('lens_mount', 'C')], { interfaces: { communication: ['USB3 Vision', 'USB'] }, prices: price(52000, 'INR', 4) }),
  part('lens-16', 'DEMO machine-vision lens 16 mm (2/3")', 'vision', 'VL-16-23', 'vision_lens', [v('focal_length', 16, 'mm'), v('max_sensor_diagonal', 11, 'mm'), t('sensor_format', '2/3"'), t('lens_mount', 'C'), t('f_number', 'f/1.4–f/16')], { prices: price(18000, 'INR', 3) }),
  part('lens-25-11', 'DEMO machine-vision lens 25 mm (1.1")', 'vision', 'VL-25-11', 'vision_lens', [v('focal_length', 25, 'mm'), v('max_sensor_diagonal', 17.6, 'mm'), t('sensor_format', '1.1"'), t('lens_mount', 'C'), t('f_number', 'f/2.0–f/16')], { prices: price(32000, 'INR', 3) }),
  part('tele-05x', 'DEMO telecentric lens 0.5×', 'vision', 'TL-05X-110', 'telecentric_lens', [v('magnification', 0.5, ''), v('max_sensor_diagonal', 11, 'mm'), v('working_distance', 110, 'mm'), t('lens_mount', 'C'), t('telecentric', 'true'), v('distortion', 0.08, '%')], { prices: price(76000, 'INR', 6) }),
  part('ring-red', 'DEMO red ring light', 'vision', 'RL-630-70', 'lighting', [t('light_type', 'Ring'), v('wavelength', 630, 'nm'), v('input_voltage', 24, 'V'), t('strobe', 'true'), v('power_consumption', 8, 'W')], { prices: price(12000, 'INR', 2) }),
  part('vision-ctrl', 'DEMO vision controller', 'vision', 'VC-4', 'vision_controller', [t('cpu', 'Quad-core (DEMO)'), v('ram', 8, 'GB'), v('power_consumption', 45, 'W')], { interfaces: { communication: ['GigE Vision', 'Ethernet', 'PROFINET', 'EtherNet/IP', 'Modbus TCP'] }, prices: price(160000, 'INR', 4) }),
  part('stage-500', 'DEMO linear stage 500 mm', 'motion', 'LS-500', 'linear_stage', [v('travel', 500, 'mm'), v('payload', 30, 'kg'), v('max_speed', 1000, 'mm/s'), v('acceleration', 10, 'm/s²'), v('positioning_repeatability', 5, 'µm'), v('positioning_accuracy', 20, 'µm')], { prices: price(210000, 'INR', 5) }),
  part('servo-400', 'DEMO servo motor 400 W', 'motion', 'SM-400', 'servo_motor', [v('rated_power', 400, 'W'), v('rated_torque', 1.27, 'N·m'), v('rated_speed', 3000, 'rpm'), v('rotor_inertia', 0.34, 'kg·cm²')], { prices: price(22000, 'INR', 3) }),
  part('drive-400', 'DEMO servo drive 400 W (EtherCAT)', 'motion', 'SD-400E', 'servo_drive', [v('rated_power', 400, 'W'), v('input_voltage', 230, 'V')], { interfaces: { communication: ['EtherCAT'] }, prices: price(28000, 'INR', 3) }),
  part('drive-200', 'DEMO servo drive 200 W (EtherCAT)', 'motion', 'SD-200E', 'servo_drive', [v('rated_power', 200, 'W'), v('input_voltage', 230, 'V')], { interfaces: { communication: ['EtherCAT'] }, prices: price(21000, 'INR', 3) }),
  part('plc-ecat', 'DEMO PLC with EtherCAT master', 'controls', 'PC-100E', 'plc', [v('digital_inputs', 16, ''), v('digital_outputs', 16, ''), v('motion_axes', 8, ''), v('scan_time', 1, 'ms'), v('power_consumption', 20, 'W')], { interfaces: { communication: ['EtherCAT', 'Ethernet', 'Modbus TCP', 'OPC UA'] }, prices: price(95000, 'INR', 4) }),
  part('plc-pn', 'DEMO PLC with PROFINET', 'controls', 'PC-200P', 'plc', [v('digital_inputs', 32, ''), v('digital_outputs', 32, ''), v('scan_time', 0.5, 'ms'), v('power_consumption', 25, 'W')], { interfaces: { communication: ['PROFINET', 'Ethernet', 'OPC UA'] }, prices: price(120000, 'INR', 6) }),
  part('hmi-10', 'DEMO HMI 10.1"', 'controls', 'HM-10', 'hmi', [v('screen_size', 10.1, 'inch'), t('display_resolution', '1280 × 800'), v('power_consumption', 12, 'W')], { interfaces: { communication: ['Ethernet'] }, prices: price(38000, 'INR', 3) }),
  part('ipc', 'DEMO industrial PC', 'controls', 'IP-7', 'ipc', [t('cpu', '8-core (DEMO)'), v('ram', 16, 'GB'), v('storage', 512, 'GB'), v('power_consumption', 90, 'W')], { interfaces: { communication: ['Ethernet', 'USB', 'GigE Vision'] }, prices: price(140000, 'INR', 4) }),
  part('safety-plc', 'DEMO safety PLC', 'safety', 'SP-8', 'safety_plc', [t('performance_level', 'e'), t('sil', '3'), v('response_time', 10, 'ms'), v('digital_inputs', 8, '')], { interfaces: { communication: ['EtherCAT', 'PROFINET'] }, prices: price(85000, 'INR', 6), certifications: [{ name: 'DEMO certification claim (fictional)', source_id: DS, verified: false }] }),
  part('light-curtain', 'DEMO safety light curtain', 'safety', 'LC-14-600', 'light_curtain', [v('detection_resolution', 14, 'mm'), v('protective_range', 600, 'mm'), v('response_time', 12, 'ms'), t('performance_level', 'e')], { prices: price(64000, 'INR', 5) }),
  part('door-switch', 'DEMO coded safety door switch', 'safety', 'DS-C', 'door_switch', [t('monitoring', 'Coded RFID actuator')], { prices: price(9000, 'INR', 2) }),
  part('scara-6', 'DEMO SCARA robot 6 kg', 'robotics', 'RB-S6', 'robot', [v('payload', 6, 'kg'), v('reach', 600, 'mm'), v('axes', 4, ''), v('positioning_repeatability', 20, 'µm'), v('power_consumption', 600, 'W')], { interfaces: { communication: ['Ethernet', 'EtherCAT'] }, prices: price(9000, 'USD', 10) }),
  part('gripper', 'DEMO electric 2-jaw gripper', 'robotics', 'GR-2E', 'gripper', [v('weight', 0.8, 'kg'), v('force', 140, 'N')], { prices: price(45000, 'INR', 4) }),
  part('chiller-1k', 'DEMO chiller 1 kW', 'thermal', 'CH-1000', 'chiller', [v('cooling_capacity', 1000, 'W'), v('temperature_stability', 0.5, '°C'), v('flow_rate', 8, 'L/min'), v('power_consumption', 800, 'W')], { prices: price(110000, 'INR', 3) }),
  part('chiller-4k', 'DEMO chiller 4 kW', 'thermal', 'CH-4000', 'chiller', [v('cooling_capacity', 4000, 'W'), v('temperature_stability', 0.5, '°C'), v('flow_rate', 25, 'L/min'), v('power_consumption', 2600, 'W')], { prices: price(260000, 'INR', 4) }),
  part('fume-200', 'DEMO fume extractor 200 m³/h', 'thermal', 'FX-200', 'fume_extraction', [v('airflow', 200, 'm³/h'), v('filter_efficiency', 99.97, '%', { condition: 'at 0.3 µm' }), v('noise', 60, 'dB(A)'), v('power_consumption', 400, 'W')], { prices: price(95000, 'INR', 3) }),
  part('weld-head', 'DEMO laser welding head 3 kW', 'photonics', 'WH-3000', 'laser_head', [v('max_power', 3000, 'W'), r('wavelength_range', 1030, 1090, 'nm'), v('focal_length', 200, 'mm'), v('spot_size', 200, 'µm'), t('cooling_method', 'Water'), v('heat_load', 200, 'W')], { prices: price(7500, 'USD', 8) }),
  part('conveyor-pcb', 'DEMO PCB edge conveyor', 'fab', 'CNV-PCB-450', 'conveyor', [r('width_range', 50, 450, 'mm'), v('max_speed', 150, 'mm/s'), v('power_consumption', 90, 'W')], { prices: price(180000, 'INR', 4) }),
  part('fixture-pcb', 'DEMO PCB stop & clamp fixture', 'fab', 'FX-PCB', 'fixture', [t('material', 'Aluminium, anodised')], { prices: price(60000, 'INR', 3) }),
  part('enclosure', 'DEMO laser enclosure (Class 1 design intent)', 'fab', 'ENC-L1', 'enclosure', [t('laser_class', 'Design intent only — not certified (DEMO)')], { prices: price(250000, 'INR', 6) }),
  part('smps-24', 'DEMO 24 V power supply 240 W', 'fab', 'PS-24-240', 'smps', [v('rated_voltage', 24, 'V'), v('output_power', 240, 'W')], { prices: price(6000, 'INR', 1) }),
  part('teal-controller', 'TEAL LaserSuite controller (DEMO overlay)', 'scan', 'TEAL-LSC-1', 'galvo_controller', [v('power_consumption', 15, 'W')], {
    scope: 'TEAL',
    record_status: 'Draft',
    manufacturer_id: undefined,
    brand: 'TEAL',
    compare_to_ids: ['prt-demo-galvo-ctrl'],
    interfaces: { communication: ['XY2-100', 'DB25', 'Ethernet'] },
    prices: price(45000, 'INR', 2),
    description: 'TEAL-side record for the TEAL overlay (§116). DEMO — maturity, cost and validation are illustrative.',
  }),
];

const compat = [
  { id: 'cmp-demo-mopa50-galvo14', entity: 'compatibility', name: 'DL-MOPA-50 ↔ SC-14', a_id: 'prt-demo-mopa-50', b_id: 'prt-demo-galvo-14', relationship: 'ManufacturerRecommended', conditions: 'With 1.5× expander (DEMO application note)', evidence: 'DEMO application note §2, table 3', data_type: 'DEMO', provenance: demoProv('src-demo-appnote') },
  { id: 'cmp-demo-cam5-tele', entity: 'compatibility', name: 'CV-5G ↔ TL-05X-110', a_id: 'prt-demo-cam-5mp', b_id: 'prt-demo-tele-05x', relationship: 'ConditionallyCompatible', conditions: 'Full-field sharpness only at the nominal 110 mm working distance (DEMO)', evidence: 'DEMO lens datasheet, MTF note', data_type: 'DEMO', provenance: demoProv() },
];

const conflicts = [
  { id: 'dcf-demo-mopa50-power', entity: 'data_conflict', name: 'DL-MOPA-50 average power: 50 W vs 48 W', part_id: 'prt-demo-mopa-50', parameter: 'average_power', source_a_id: DS, value_a: '50 W', source_b_id: DIST, value_b: '48 W', conflict_status: 'Open', data_type: 'DEMO', provenance: demoProv() },
];

/* ------------------------------------------------------------ DEMO simulation scenarios */

const d = (o: St): St => ({ time_basis: 'DEMO', ...o });
const MACHINE = (sel: [string, string, string][]) => sel.map(([role, id, key = '_machine']) => ({ station_key: key, role, part_id: id }));

const pcbStations = (laserParallel: number, speed: number, buffer: number): St[] => [
  st('load', 'Board in (conveyor)', 'load', d({ time_s: 2.5, dist: { type: 'triangular', min: 2, mode: 2.5, max: 3.5 }, buffer_after: 2, power_kw: 0.09, slots: [slot('Conveyor', 'conveyor')], mtbf_min: 2400, mttr_min: 10, capex: 150000, footprint_m2: 0.6 })),
  st('fixture', 'Board stop & clamp', 'fixture', d({ time_s: 1.5, dist: { type: 'uniform', min: 1.2, max: 1.8 }, slots: [slot('Fixture', 'fixture')], capex: 80000, footprint_m2: 0.4 })),
  st('align', 'Fiducial alignment', 'align', d({ time_s: 1.2, dist: { type: 'uniform', min: 0.9, max: 1.8 }, slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens'), slot('Lighting', 'lighting', false)], capex: 60000, footprint_m2: 0.4 })),
  st('laser', 'Laser marking', 'laser', {
    time_s: null,
    time_basis: 'CALCULATED',
    laser: { area_mm2: 300, hatch_mm: 0.03, speed_mm_s: speed, passes: 1, jump_overhead_s: 0.8, power_w: 20, frequency_khz: 60 },
    dist: { type: 'normal', sd: 0.25 },
    parallel: laserParallel,
    buffer_after: buffer,
    mtbf_min: 4800,
    mttr_min: 30,
    capex: 220000,
    footprint_m2: 1.2,
    slots: [slot('Laser source', 'laser_source'), slot('Beam expander', 'beam_expander', false), slot('Galvo scanner', 'galvo'), slot('F-theta lens', 'f_theta'), slot('Galvo controller', 'galvo_controller', false), slot('Fume extraction', 'fume_extraction', false)],
  }),
  st('inspect', 'Code verification (grade)', 'inspect', d({ time_s: 1.0, dist: { type: 'uniform', min: 0.8, max: 1.4 }, reject_rate: 0.01, slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens')], capex: 60000, footprint_m2: 0.4 })),
  st('sort', 'OK / NG sorting', 'sort', d({ time_s: 1.0, capex: 70000, footprint_m2: 0.5 })),
  st('unload', 'Board out (conveyor)', 'unload', d({ time_s: 2.0, dist: { type: 'triangular', min: 1.6, mode: 2, max: 2.8 }, power_kw: 0.09, capex: 120000, footprint_m2: 0.6 })),
];
const pcbSel = (parallel: number, laser = 'prt-demo-mopa-20', galvo = 'prt-demo-galvo-10') => [
  { station_key: 'load', role: 'Conveyor', part_id: 'prt-demo-conveyor-pcb' },
  { station_key: 'fixture', role: 'Fixture', part_id: 'prt-demo-fixture-pcb' },
  { station_key: 'align', role: 'Camera', part_id: 'prt-demo-cam-5mp' },
  { station_key: 'align', role: 'Lens', part_id: 'prt-demo-lens-16' },
  { station_key: 'align', role: 'Lighting', part_id: 'prt-demo-ring-red' },
  { station_key: 'laser', role: 'Laser source', part_id: laser, quantity: parallel },
  { station_key: 'laser', role: 'Beam expander', part_id: 'prt-demo-bex-15x', quantity: parallel },
  { station_key: 'laser', role: 'Galvo scanner', part_id: galvo, quantity: parallel },
  { station_key: 'laser', role: 'F-theta lens', part_id: 'prt-demo-ft-160', quantity: parallel },
  { station_key: 'laser', role: 'Galvo controller', part_id: 'prt-demo-galvo-ctrl', quantity: parallel },
  { station_key: 'laser', role: 'Fume extraction', part_id: 'prt-demo-fume-200' },
  { station_key: 'inspect', role: 'Camera', part_id: 'prt-demo-cam-5mp' },
  { station_key: 'inspect', role: 'Lens', part_id: 'prt-demo-lens-16' },
  ...MACHINE([
    ['PLC', 'prt-demo-plc-ecat', '_machine'],
    ['HMI', 'prt-demo-hmi-10', '_machine'],
    ['Safety controller', 'prt-demo-safety-plc', '_machine'],
    ['Door interlock', 'prt-demo-door-switch', '_machine'],
    ['Power supply', 'prt-demo-smps-24', '_machine'],
    ['Enclosure', 'prt-demo-enclosure', '_machine'],
  ]),
];
const SEQ = [
  { key: 'start', name: 'START', kind: 'start' },
  { key: 'safety', name: 'Safety check', kind: 'check', interlock: 'Doors closed, E-stop healthy', alarm: 'Safety circuit open' },
  { key: 'present', name: 'Part present', kind: 'check', sensor: 'Board-present photoelectric sensor', timer_s: 5, alarm: 'Part missing (timeout)' },
  { key: 'clamp', name: 'Clamp', kind: 'action', actuator: 'Stopper + clamp cylinder', sensor: 'Clamp reed switch', timer_s: 1, alarm: 'Clamp not confirmed' },
  { key: 'vision', name: 'Vision', kind: 'action', actuator: 'Alignment camera trigger', condition: 'Fiducials found', alarm: 'Vision failure' },
  { key: 'position', name: 'Position', kind: 'action', condition: 'Offsets applied to the marking job' },
  { key: 'enable', name: 'Laser enable', kind: 'action', interlock: 'Enclosure interlock closed, extraction running', alarm: 'Laser not ready' },
  { key: 'process', name: 'Process', kind: 'action', actuator: 'Laser + scanner job' },
  { key: 'disable', name: 'Laser disable', kind: 'action' },
  { key: 'inspect', name: 'Inspection', kind: 'action', actuator: 'Verification camera', condition: 'Code grade ≥ target' },
  { key: 'decide', name: 'Decision', kind: 'decision', condition: 'Grade OK → OK lane; else NG lane' },
  { key: 'unclamp', name: 'Unclamp', kind: 'action', actuator: 'Clamp cylinder', sensor: 'Clamp reed switch' },
  { key: 'unload', name: 'Unload', kind: 'action', actuator: 'Out-conveyor' },
  { key: 'done', name: 'Complete', kind: 'end' },
];
const shift = { hours_per_shift: 8, shifts_per_day: 3, days_per_year: 300, planned_downtime_min_per_shift: 30 };
const simProv = { ...demoProv(), note: `${DEMO_NOTE} Station times are DEMO assumptions — not measured.` };
const sims = [
  {
    id: 'sim-demo-pcb-a',
    entity: 'simulation',
    name: 'PCB laser marking — Scenario A (single laser station)',
    scenario_label: 'A',
    template_id: 'eqt-pcb-laser-marking',
    config_level: 'Customer Configuration',
    sim_status: 'Draft',
    customer_id: 'cus-demo-ems',
    project_id: 'prj-demo-c2i',
    product_id: 'prd-markc2i',
    application_id: 'app-markc2i.dual',
    material_id: 'mat-soldermask',
    recipe_id: 'rcp-demo-pcb-mark',
    stations: pcbStations(1, 1500, 2),
    selections: pcbSel(1),
    targets: { uph: 500, capex_budget: 4500000, footprint_m2: 6, localization_pct: 50 },
    shift,
    oee: { performance: 0.95, quality: 0.99 },
    currency: 'INR',
    required_protocols: ['EtherCAT'],
    faults: [
      { key: 'vision', name: 'Vision failure', station_key: 'align', at_min: 90, duration_min: 12 },
      { key: 'laser', name: 'Laser unavailable', station_key: 'laser', at_min: 200, duration_min: 25 },
    ],
    maintenance: { pm_interval_h: 160, pm_duration_min: 90, calibration_interval_h: 720, calibration_duration_min: 60 },
    energy: { tariff_per_kwh: 9, compressed_air_kw: 0.75, idle_fraction: 0.35 },
    sequence: SEQ,
    version: 1,
    data_type: 'DEMO',
    provenance: simProv,
    tags: ['demo'],
  },
  {
    id: 'sim-demo-pcb-b',
    entity: 'simulation',
    name: 'PCB laser marking — Scenario B (two laser stations)',
    scenario_label: 'B',
    parent_id: 'sim-demo-pcb-a',
    change_reason: 'Scenario A misses 500 UPH; add a second laser station in parallel',
    template_id: 'eqt-pcb-laser-marking',
    config_level: 'Customer Configuration',
    sim_status: 'Draft',
    customer_id: 'cus-demo-ems',
    project_id: 'prj-demo-c2i',
    product_id: 'prd-markc2i',
    application_id: 'app-markc2i.dual',
    material_id: 'mat-soldermask',
    stations: pcbStations(2, 1500, 3),
    selections: pcbSel(2),
    targets: { uph: 500, capex_budget: 4500000, footprint_m2: 6, localization_pct: 50 },
    shift,
    oee: { performance: 0.95, quality: 0.99 },
    currency: 'INR',
    required_protocols: ['EtherCAT'],
    maintenance: { pm_interval_h: 160, pm_duration_min: 90 },
    energy: { tariff_per_kwh: 9, compressed_air_kw: 0.75, idle_fraction: 0.35 },
    sequence: SEQ,
    version: 2,
    data_type: 'DEMO',
    provenance: simProv,
    tags: ['demo'],
  },
  {
    id: 'sim-demo-pcb-c',
    entity: 'simulation',
    name: 'PCB laser marking — Scenario C (faster marking, 30 W source)',
    scenario_label: 'C',
    parent_id: 'sim-demo-pcb-a',
    change_reason: 'Keep one station; raise marking speed with a 30 W source and larger scanner',
    template_id: 'eqt-pcb-laser-marking',
    config_level: 'Customer Configuration',
    sim_status: 'Draft',
    customer_id: 'cus-demo-ems',
    project_id: 'prj-demo-c2i',
    product_id: 'prd-markc2i',
    application_id: 'app-markc2i.dual',
    material_id: 'mat-soldermask',
    stations: pcbStations(1, 2500, 2),
    selections: pcbSel(1, 'prt-demo-mopa-30', 'prt-demo-galvo-14'),
    targets: { uph: 500, capex_budget: 4500000, footprint_m2: 6, localization_pct: 50 },
    shift,
    oee: { performance: 0.95, quality: 0.99 },
    currency: 'INR',
    required_protocols: ['EtherCAT'],
    maintenance: { pm_interval_h: 160, pm_duration_min: 90 },
    energy: { tariff_per_kwh: 9, compressed_air_kw: 0.75, idle_fraction: 0.35 },
    sequence: SEQ,
    version: 2,
    data_type: 'DEMO',
    provenance: simProv,
    tags: ['demo'],
  },
  {
    id: 'sim-demo-battery-tab',
    entity: 'simulation',
    name: 'Battery tab welding — module line (DEMO)',
    scenario_label: 'A',
    template_id: 'eqt-battery-tab-welding',
    config_level: 'Equipment Variant',
    sim_status: 'Draft',
    customer_id: 'cus-demo-battery',
    opportunity_id: 'opp-demo-battery-tab',
    product_id: 'prd-weldb',
    stations: [
      st('load', 'Module / cell load', 'load', d({ time_s: 6, dist: { type: 'triangular', min: 5, mode: 6, max: 8 }, buffer_after: 1, capex: 350000 })),
      st('fixture', 'Clamp & tab pressing', 'fixture', d({ time_s: 3, slots: [slot('Fixture', 'fixture')], capex: 400000 })),
      st('align', 'Tab position vision', 'align', d({ time_s: 2, slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens')], capex: 60000 })),
      st('laser', 'Laser tab welding', 'laser', {
        time_s: null,
        time_basis: 'CALCULATED',
        laser: { path_mm: 240, speed_mm_s: 100, passes: 1, jump_overhead_s: 4.8, power_w: 1500 },
        dist: { type: 'normal', sd: 0.4 },
        mtbf_min: 3000,
        mttr_min: 45,
        capex: 600000,
        slots: [slot('Laser source', 'laser_source'), slot('Processing head', 'laser_head'), slot('Motion axis', 'linear_stage'), slot('Chiller', 'chiller'), slot('Fume extraction', 'fume_extraction', false)],
      }),
      st('inspect', 'Weld seam inspection', 'inspect', d({ time_s: 3, reject_rate: 0.02, rework_rate: 0.5, slots: [slot('Camera', 'camera'), slot('Lens', 'vision_lens')], capex: 90000 })),
      st('unload', 'Unload', 'unload', d({ time_s: 5, capex: 250000 })),
    ],
    selections: [
      { station_key: 'align', role: 'Camera', part_id: 'prt-demo-cam-12mp' },
      { station_key: 'align', role: 'Lens', part_id: 'prt-demo-lens-16' },
      { station_key: 'laser', role: 'Laser source', part_id: 'prt-demo-cw-1500' },
      { station_key: 'laser', role: 'Processing head', part_id: 'prt-demo-weld-head' },
      { station_key: 'laser', role: 'Motion axis', part_id: 'prt-demo-stage-500' },
      { station_key: 'laser', role: 'Chiller', part_id: 'prt-demo-chiller-1k' },
      { station_key: 'inspect', role: 'Camera', part_id: 'prt-demo-cam-5mp' },
      { station_key: 'inspect', role: 'Lens', part_id: 'prt-demo-lens-16' },
      ...MACHINE([
        ['PLC', 'prt-demo-plc-pn', '_machine'],
        ['Servo drive', 'prt-demo-drive-200', '_machine'],
        ['Servo motor', 'prt-demo-servo-400', '_machine'],
        ['Safety controller', 'prt-demo-safety-plc', '_machine'],
        ['Light curtain', 'prt-demo-light-curtain', '_machine'],
      ]),
    ],
    targets: { uph: 150, capex_budget: 9000000 },
    shift: { hours_per_shift: 8, shifts_per_day: 2, days_per_year: 300 },
    oee: { performance: 0.9, quality: 0.98 },
    currency: 'INR',
    required_protocols: ['EtherCAT'],
    data_type: 'DEMO',
    provenance: { ...simProv, note: `${simProv.note} Contains deliberate issues (chiller undersized, drive/motor mismatch, PLC without EtherCAT) for the design review to find.` },
    tags: ['demo'],
  },
  {
    id: 'sim-demo-semi-marking',
    entity: 'simulation',
    name: 'Semiconductor package marking — strip line (DEMO)',
    scenario_label: 'A',
    template_id: 'eqt-semiconductor-marking',
    config_level: 'Customer Configuration',
    sim_status: 'Draft',
    customer_id: 'cus-demo-osat',
    opportunity_id: 'opp-demo-pkg-marking',
    product_id: 'prd-semispm',
    application_id: 'app-semispm.mould',
    material_id: 'mat-emc',
    requirement_ids: ['req-demo-s1-01', 'req-demo-s1-02', 'req-demo-s1-03', 'req-demo-s1-04', 'req-demo-s1-05', 'req-demo-s1-06'],
    stations: [
      st('load', 'Magazine / strip loading', 'load', d({ time_s: 4 })),
      st('fixture', 'Strip clamp', 'fixture', d({ time_s: null })),
      st('align', 'Strip alignment', 'align', d({ time_s: 1.5 })),
      st('laser', 'Laser marking', 'laser', { time_s: null, laser: { area_mm2: null, hatch_mm: 0.05, speed_mm_s: 2000, passes: 1 } }),
      st('inspect', 'Mark inspection (OCR / 2D)', 'inspect', d({ time_s: 2 })),
      st('sort', 'Reject mapping', 'sort', d({ time_s: 1 })),
      st('unload', 'Strip unloading', 'unload', d({ time_s: 4 })),
    ],
    targets: { uph: null },
    currency: 'INR',
    data_type: 'DEMO',
    provenance: { ...simProv, note: `${simProv.note} Incomplete on purpose: clamp time, marked area and target UPH are UNKNOWN until the customer confirms them — the Studio says what is missing.` },
    tags: ['demo'],
  },
];

const recipes = [
  {
    id: 'rcp-demo-pcb-mark',
    entity: 'recipe',
    name: 'PCB 2D-code marking on solder mask — v0.1 (DEMO)',
    simulation_id: 'sim-demo-pcb-a',
    product_id: 'prd-markc2i',
    application_id: 'app-markc2i.dual',
    material_id: 'mat-soldermask',
    recipe_version: '0.1',
    parameters: [
      { name: 'Power', value: '20', unit: 'W' },
      { name: 'Speed', value: '1500', unit: 'mm/s' },
      { name: 'Frequency', value: '60', unit: 'kHz' },
      { name: 'Hatch', value: '0.03', unit: 'mm' },
      { name: 'Passes', value: '1', unit: '' },
    ],
    quality_criteria: ['Code grade (ISO/IEC 29158) — target to be agreed with the customer'],
    acceptance_criteria: ['To be defined with the customer — nothing pre-filled'],
    recipe_status: 'Draft',
    data_type: 'DEMO',
    provenance: demoProv(DS, { note: `${DEMO_NOTE} Parameters are DEMO starting values, not validated.` }),
    tags: ['demo'],
  },
];

const verifications = [
  { id: 'ver-demo-s1-01', entity: 'verification', name: 'Verify 2D code marking on package (DEMO)', kind: 'Verification', requirement_id: 'req-demo-s1-01', method: 'Test', expected: 'Readable 2D code on every package (grade to be agreed)', result: 'NOT RUN', simulation_id: 'sim-demo-semi-marking', data_type: 'DEMO', provenance: demoProv(DS, { note: `${DEMO_NOTE} Planned verification — no result recorded.` }), tags: ['demo'] },
  { id: 'ver-demo-s1-04', entity: 'verification', name: 'Verify mark inspection function (DEMO)', kind: 'Verification', requirement_id: 'req-demo-s1-04', method: 'Demonstration', result: 'NOT RUN', simulation_id: 'sim-demo-semi-marking', data_type: 'DEMO', provenance: demoProv(DS, { note: `${DEMO_NOTE} Planned verification — no result recorded.` }), tags: ['demo'] },
];

/* ------------------------------------------------------------ write */

const E = join(DATA_DIR, 'engineering');
writeJson(join(E, 'spec-definitions.json'), { dataset: hdr('spec-definitions', 'Specification definitions', 'spec_definition', 'Dynamic specification catalogue (master prompt §12, §15–§35): parameter names, data types, canonical units and the product types they apply to. Holds no values.', 'TEAL_INTERNAL', [SRC]), records: specs });
writeJson(join(E, 'compatibility-rules.json'), { dataset: hdr('compatibility-rules', 'Compatibility rules', 'compatibility_rule', 'Engineering compatibility rules (master prompt §44). Editable, versioned, source-tagged; DRAFT until TEAL reviews them. A rule result is an engineering inference, never a manufacturer confirmation.', 'TEAL_INTERNAL', [SRC]), records: rules });
writeJson(join(E, 'equipment-templates.json'), { dataset: hdr('equipment-templates', 'Equipment templates', 'equipment_template', 'Equipment structures (master prompt §60, §61): stations, component slots and flow. Station times, capacities and costs are empty — they are entered per scenario with their basis.', 'TEAL_INTERNAL', [SRC]), records: templates });

const D = join(DATA_DIR, 'demo');
const demoHdr = (id: string, title: string, entity: string, description: string, partition = 'engineering') => hdr(id, title, entity, description, 'DEMO', ['src-demo-datasheets'], partition);
writeJson(join(D, 'engineering-sources.json'), { dataset: demoHdr('demo-engineering-sources', 'DEMO engineering sources', 'source', 'Fictional datasheet, application-note and distributor sources for the DEMO engineering database.', 'knowledge'), records: demoSources });
writeJson(join(D, 'engineering-manufacturers.json'), { dataset: demoHdr('demo-manufacturers', 'DEMO manufacturers', 'company', 'Fictional manufacturers for the DEMO engineering database. Not real companies.', 'companies'), records: manufacturers });
writeJson(join(D, 'engineering-parts.json'), { dataset: demoHdr('demo-parts', 'DEMO engineering products', 'part', 'Fictional lasers, scanners, optics, vision, motion, controls, safety, robotics and periphery with DEMO specifications and DEMO prices — for demonstrating search, compatibility, simulation and cost. Not real products.'), records: parts });
writeJson(join(D, 'engineering-compatibility.json'), { dataset: demoHdr('demo-compatibility', 'DEMO compatibility relationships', 'compatibility', 'Fictional recorded relationships with evidence.'), records: compat });
writeJson(join(D, 'engineering-conflicts.json'), { dataset: demoHdr('demo-data-conflicts', 'DEMO data conflicts', 'data_conflict', 'A fictional source disagreement for the Data Review Center.'), records: conflicts });
writeJson(join(D, 'simulations.json'), { dataset: demoHdr('demo-simulations', 'DEMO simulation scenarios', 'simulation', 'Fictional equipment scenarios for the Equipment Simulation Studio. Station times are DEMO assumptions, not measurements.'), records: sims });
writeJson(join(D, 'recipes.json'), { dataset: demoHdr('demo-recipes', 'DEMO process recipes', 'recipe', 'Fictional starting recipe — not validated.', 'records'), records: recipes });
writeJson(join(D, 'verifications.json'), { dataset: demoHdr('demo-verifications', 'DEMO verifications', 'verification', 'Planned verifications with no results recorded.', 'records'), records: verifications });

console.log(`spec definitions ${specs.length} · rules ${rules.length} · templates ${templates.length} · parts ${parts.length} · manufacturers ${manufacturers.length} · simulations ${sims.length}`);
