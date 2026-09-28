import type { AnyRecord } from '../../domain';
import type { Part, SpecValue } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import type { ItemMaster, Supplier } from '../../domain/entities';
import { completeness, KEY_SPECS } from './specs';

/*
 * Component datasheets for EVERY component the platform holds (item master, engineering parts,
 * laser-source classes, f-theta objectives, automation modules).
 *
 * Nothing here adds a number that is not already in a record: technical values are parsed from the
 * component's own specification text (each row keeps the exact token it came from), supplier fields
 * come from the linked supplier / company record, and whatever is not stated is returned as missing
 * so the UI shows "Not Available".
 */

/* ------------------------------------------------------------ product type of an item-master row */

const TYPE_RULES: [RegExp, string][] = [
  [/co2 laser|laser tube|fib(re|er) laser|laser source/i, 'laser_source'],
  [/galvo|scan head/i, 'galvo'],
  [/f-theta/i, 'f_theta'],
  [/welding head/i, 'laser_head'],
  [/beam expander/i, 'beam_expander'],
  [/protective window/i, 'window'],
  [/xy stage|linear stage/i, 'linear_stage'],
  [/guide rail/i, 'linear_guide'],
  [/ballscrew/i, 'ballscrew'],
  [/gearbox/i, 'gearbox'],
  [/indexer/i, 'indexer'],
  [/cobot|robot/i, 'robot'],
  [/vision camera|camera/i, 'camera'],
  [/telecentric/i, 'telecentric_lens'],
  [/lighting/i, 'lighting'],
  [/proximity sensor/i, 'proximity_sensor'],
  [/displacement sensor/i, 'displacement_sensor'],
  [/leak detector/i, 'leak_detector'],
  [/safety plc/i, 'safety_plc'],
  [/plc cpu|\bplc\b/i, 'plc'],
  [/hmi/i, 'hmi'],
  [/servo drive/i, 'servo_drive'],
  [/servo motor/i, 'servo_motor'],
  [/motion controller/i, 'motion_controller'],
  [/panel cooling/i, 'panel_cooling'],
  [/control panel/i, 'electrical_cabinet'],
  [/laser enclosure/i, 'enclosure'],
  [/light curtain/i, 'light_curtain'],
  [/safety relay/i, 'safety_relay'],
  [/fume extraction/i, 'fume_extraction'],
  [/valve terminal/i, 'valve'],
  [/cylinder/i, 'cylinder'],
  [/vacuum/i, 'vacuum'],
  [/chiller/i, 'chiller'],
  [/industrial pc/i, 'ipc'],
  [/ffu|hepa module/i, 'ffu'],
  [/cable/i, 'cable'],
  [/extrusion|plate|sheet|granite/i, 'raw_material'],
  [/fastener|dowel/i, 'hardware'],
];

export function itemProductType(item: Pick<ItemMaster, 'name' | 'category'>): string {
  return TYPE_RULES.find(([re]) => re.test(item.name))?.[1] ?? 'other';
}

/** Key specifications an engineer needs per type (extends the engineering KEY_SPECS for item types). */
export const ITEM_KEY_SPECS: Record<string, string[]> = {
  ...KEY_SPECS,
  window: ['material', 'diameter', 'coating', 'damage_threshold'],
  linear_guide: ['load_capacity', 'tolerance'],
  ballscrew: ['diameter', 'tolerance', 'travel'],
  gearbox: ['gear_ratio', 'backlash', 'rated_torque'],
  indexer: ['axes', 'positioning_repeatability', 'load_capacity'],
  lighting: ['light_type', 'color', 'intensity', 'strobe'],
  proximity_sensor: ['sensing_range', 'output_type', 'ip_rating', 'response_time'],
  displacement_sensor: ['sensing_range', 'resolution', 'response_time'],
  leak_detector: ['sensor_type', 'sensing_range'],
  safety_plc: ['digital_inputs', 'digital_outputs', 'performance_level', 'sil'],
  plc: ['cpu', 'program_memory', 'digital_inputs', 'digital_outputs', 'scan_time'],
  hmi: ['screen_size', 'display_resolution', 'touch'],
  servo_drive: ['rated_power', 'rated_current', 'input_voltage'],
  servo_motor: ['rated_power', 'rated_torque', 'rated_speed', 'encoder_type'],
  motion_controller: ['motion_axes', 'scan_time'],
  panel_cooling: ['cooling_capacity', 'input_voltage'],
  electrical_cabinet: ['dimensions', 'ip_rating', 'material'],
  enclosure: ['laser_class', 'dimensions', 'material'],
  light_curtain: ['protective_range', 'detection_resolution', 'performance_level', 'response_time'],
  safety_relay: ['performance_level', 'output_type'],
  valve: ['port', 'pressure', 'flow_rate'],
  cylinder: ['bore', 'travel', 'force', 'pressure'],
  vacuum: ['vacuum', 'flow_rate'],
  ipc: ['cpu', 'ram', 'storage', 'os'],
  ffu: ['airflow', 'filter_efficiency', 'dimensions'],
  cable: ['connector'],
  raw_material: ['material', 'dimensions', 'surface_finish'],
  hardware: ['material', 'tolerance'],
};

/* ------------------------------------------------------------ spec-text parser */

export interface ParsedSpec extends SpecValue {
  /** a readable label when the value has no spec definition key */
  label?: string;
}

const num = (s: string) => Number(s.replace(/,/g, ''));

/**
 * Parse a free-text specification ("1064nm, 20W, pulse 4–200ns, air cooled") into specification rows.
 * Every comma-separated token is kept: recognised ones become typed rows, the rest become
 * "Other stated specification" rows with the original text. The parser never adds a value.
 */
export function parseSpecText(text: string | undefined, productType: string, base: Pick<SpecValue, 'source_id' | 'evidence' | 'confidence' | 'retrieved_at'>): ParsedSpec[] {
  if (!text) return [];
  const out: ParsedSpec[] = [];
  const row = (spec: string, v: Partial<SpecValue>, original: string, label?: string) => out.push({ spec, ...v, original, extraction_status: 'EXTRACTED', ...base, label });
  for (const raw of text.split(/,\s*(?![^()]*\))/)) {
    const t = raw.trim();
    if (!t) continue;
    const before = out.length;
    let m: RegExpMatchArray | null;
    if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(nm|µm|um)$/i))) row('wavelength', { value: m[2].toLowerCase() === 'nm' ? num(m[1]) : num(m[1]) * 1000, unit: 'nm' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(kW|W)$/))) {
      const w = m[2] === 'kW' ? num(m[1]) * 1000 : num(m[1]);
      const key = productType === 'chiller' || productType === 'panel_cooling' ? 'cooling_capacity' : productType === 'laser_source' ? 'average_power' : 'rated_power';
      row(key, { value: w, unit: 'W' }, t);
    } else if ((m = t.match(/pulse\s*(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*ns/i))) row('pulse_width_range', { min: num(m[1]), max: num(m[2]), unit: 'ns' }, t);
    else if ((m = t.match(/^(air|water)[\s-]cooled$/i))) row('cooling_method', { text: `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} cooled` }, t);
    else if (/^QBH$/i.test(t)) row('connector', { text: 'QBH fiber connector' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm aperture$/i))) row('aperture', { value: num(m[1]), unit: 'mm' }, t);
    else if (/XY2-100|SL2-100/i.test(t)) row('analog_control', { text: t }, t, 'Scanner protocol');
    else if ((m = t.match(/(\d)-axis dynamic focus/i))) row('axes', { value: num(m[1]), text: t }, t, 'Scan axes');
    else if ((m = t.match(/^EFL\s*(\d+(?:\.\d+)?)\s*mm$/i))) row('focal_length', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^field\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i))) {
      row('scan_field_x', { value: num(m[1]), unit: 'mm' }, t);
      row('scan_field_y', { value: num(m[2]), unit: 'mm' }, t);
    } else if ((m = t.match(/^(?:motorised,\s*)?(\d+(?:\.\d+)?)x$/i))) row('magnification', { value: num(m[1]), unit: '×' }, t);
    else if (/^motorised$/i.test(t)) row('adjustment', { text: 'Motorised' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm travel$/i))) row('travel', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^±\s*(\d+(?:\.\d+)?)\s*(µm|um)$/i))) row('positioning_accuracy', { value: num(m[1]), unit: 'µm' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(µm|um) repeatability$/i))) row('positioning_repeatability', { value: num(m[1]), unit: 'µm' }, t);
    else if ((m = t.match(/^(\d+)\s*x\s*(\d+)$/)) && productType === 'linear_stage') row('travel', { text: `${m[1]} × ${m[2]} mm (XY)` }, t, 'XY travel');
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*kg payload$/i))) row('payload', { value: num(m[1]), unit: 'kg' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm reach$/i))) row('reach', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^IP\s?(\d{2})$/i))) row('ip_rating', { text: `IP${m[1]}` }, t);
    else if (/^SCARA$/i.test(t)) row('axes', { text: 'SCARA' }, t, 'Kinematics');
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*MP\s*(mono|colou?r)?$/i))) {
      row('megapixel', { value: num(m[1]), unit: 'MP' }, t);
      if (m[2]) row('sensor_type', { text: m[2].toLowerCase() === 'mono' ? 'Monochrome' : 'Colour' }, t);
    } else if (/global shutter|rolling shutter/i.test(t)) row('shutter', { text: /global/i.test(t) ? 'Global' : 'Rolling' }, t);
    else if (/^(GigE|USB3|CoaXPress|Camera Link)$/i.test(t)) row('connector', { text: t }, t, 'Camera interface');
    else if ((m = t.match(/^WD\s*(\d+(?:\.\d+)?)\s*mm$/i))) row('working_distance', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^([CF]|M\d+)-mount$/i))) row('lens_mount', { text: `${m[1]}-mount` }, t);
    else if ((m = t.match(/^(red|white|blue|green|ir)\s*(\d+)\s*nm$/i))) {
      row('color', { text: m[1] }, t);
      row('wavelength', { value: num(m[2]), unit: 'nm' }, t, 'Illumination wavelength');
    } else if (/dome|bar|ring|coaxial/i.test(t) && productType === 'lighting') row('light_type', { text: t }, t);
    else if (/^controller$/i.test(t)) row('strobe', { text: 'Controller included' }, t, 'Controller');
    else if ((m = t.match(/^M(\d+)$/))) row('thread', { text: `M${m[1]}` }, t, 'Housing thread');
    else if ((m = t.match(/^(PNP|NPN)\s*(NO|NC)?$/i))) row('output_type', { text: t.toUpperCase() }, t);
    else if ((m = t.match(/^Sn\s*(\d+(?:\.\d+)?)\s*mm$/i))) row('sensing_range', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^±\s*(\d+(?:\.\d+)?)\s*mm range$/i))) row('sensing_range', { min: -num(m[1]), max: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(µm|um) resolution$/i))) row('resolution', { value: num(m[1]), unit: 'µm' }, t);
    else if (/mbar\.?l\/s/i.test(t)) row('sensing_range', { text: t }, t, 'Detection limit');
    else if (/mass spectrometer/i.test(t)) row('sensor_type', { text: 'Mass spectrometer' }, t);
    else if ((m = t.match(/(\d+)DI\s*\/\s*(\d+)DO/i))) {
      row('digital_inputs', { value: num(m[1]) }, t);
      row('digital_outputs', { value: num(m[2]) }, t);
    } else if (/fail-safe cpu/i.test(t)) row('cpu', { text: 'Fail-safe CPU' }, t);
    else if (/^(PROFINET|PROFIsafe|EtherCAT master|EtherCAT|PN\/DP|Modbus TCP|EtherNet\/IP)/i.test(t) || /PN\/DP/.test(t)) {
      const cpu = t.match(/^(\d{4}-\d\s*)/);
      if (cpu) row('cpu', { text: cpu[1].trim() }, t, 'CPU model');
      row('connector', { text: t.replace(/^\d{4}-\d\s*/, '') }, t, 'Communication');
    } else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*MB work memory$/i))) row('program_memory', { value: num(m[1]), unit: 'MB' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*in TFT$/i))) row('screen_size', { value: num(m[1]), unit: 'inch' }, t);
    else if (/multitouch|touch/i.test(t)) row('touch', { text: 'Multitouch' }, t);
    else if ((m = t.match(/^1-axis$/i))) row('axes', { value: 1 }, t, 'Axes');
    else if (/^STO$/i.test(t)) row('monitoring', { text: 'Safe Torque Off (STO)' }, t, 'Safety function');
    else if ((m = t.match(/^(\d+)\s*rpm$/i))) row('rated_speed', { value: num(m[1]), unit: 'rpm' }, t);
    else if (/absolute encoder|incremental encoder/i.test(t)) row('encoder_type', { text: /absolute/i.test(t) ? 'Absolute' : 'Incremental' }, t);
    else if (/^brake$/i.test(t)) row('mounting', { text: 'Holding brake' }, t, 'Brake');
    else if ((m = t.match(/^(\d+)\s*axes$/i))) row('motion_axes', { value: num(m[1]) }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*ms cycle$/i))) row('scan_time', { value: num(m[1]), unit: 'ms' }, t, 'Cycle time');
    else if (/^Rittal|^RAL/i.test(t)) row('material', { text: t }, t, /^RAL/i.test(t) ? 'Colour' : 'Enclosure system');
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*V$/))) row('input_voltage', { value: num(m[1]), unit: 'V' }, t);
    else if (/^air\/air$/i.test(t)) row('cooling_method', { text: 'Air / air heat exchanger' }, t);
    else if (/^interlocked$/i.test(t)) row('monitoring', { text: 'Interlocked' }, t, 'Door interlock');
    else if ((m = t.match(/OD\s*(\d+)\s*@\s*(\d+)\s*nm/i))) row('laser_class', { text: `Viewing window OD${m[1]} @ ${m[2]} nm` }, t, 'Laser safety window');
    else if ((m = t.match(/^Type\s*(\d)$/i))) row('performance_level', { text: `Type ${m[1]} (IEC 61496)` }, t, 'ESPE type');
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm res$/i))) row('detection_resolution', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm height$/i))) row('protective_range', { value: num(m[1]), unit: 'mm' }, t, 'Protective height');
    else if ((m = t.match(/^Cat\s*(\d)\s*PL\s*([a-e])$/i))) row('performance_level', { text: `Category ${m[1]}, PL ${m[2]}` }, t);
    else if (/^\d+NO\+\d+NC$/i.test(t)) row('output_type', { text: t }, t, 'Contacts');
    else if (/HEPA|carbon/i.test(t) && !/module/i.test(t)) row('filter_type', { text: t }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*m3\/h$/i))) row('airflow', { value: num(m[1]), unit: 'm³/h' }, t);
    else if (/laser rated/i.test(t)) row('filter_type', { text: 'Laser-process rated' }, t, 'Rating');
    else if ((m = t.match(/^(\d+)\s*station$/i))) row('port', { text: `${m[1]} stations` }, t, 'Valve stations');
    else if ((m = t.match(/^(\d)\/(\d)$/))) row('port', { text: `${m[1]}/${m[2]} way` }, t, 'Valve function');
    else if (/^ISO\s*\d{4,5}$/i.test(t)) row('mounting', { text: t }, t, 'Standard');
    else if ((m = t.match(/^bore\s*(\d+)$/i))) row('bore', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^stroke\s*(\d+)$/i))) row('travel', { value: num(m[1]), unit: 'mm' }, t, 'Stroke');
    else if (/ejector/i.test(t)) row('vacuum', { text: t }, t, 'Vacuum generation');
    else if ((m = t.match(/^(\d+)x(\d+)mm cups$/i))) row('diameter', { text: `${m[1]} × Ø${m[2]} mm cups` }, t, 'Suction cups');
    else if ((m = t.match(/^(\d+)\s*x\s*(\d+)\s*x\s*(\d+)$/)) && /panel|cabinet/i.test(productType + ' electrical_cabinet')) row('dimensions', { text: `${m[1]} × ${m[2]} × ${m[3]} mm` }, t);
    else if ((m = t.match(/^(\d+)x(\d+)$/)) && productType === 'ffu') row('dimensions', { text: `${m[1]} × ${m[2]} mm` }, t);
    else if (/^(ISO Class \d|H1[34]|cleanroom ISO\d)$/i.test(t)) row('filter_efficiency', { text: t }, t, 'Cleanliness / filter class');
    else if ((m = t.match(/^(\d+)mm wafer$/i))) row('workspace', { text: `${m[1]} mm wafers` }, t, 'Payload format');
    else if ((m = t.match(/^ratio\s*(\d+(?:\.\d+)?)$/i))) row('gear_ratio', { value: num(m[1]) }, t);
    else if ((m = t.match(/^backlash\s*<\s*(\d+(?:\.\d+)?)\s*arcmin$/i))) row('backlash', { max: num(m[1]), unit: 'arcmin' }, t);
    else if (/^planetary$/i.test(t)) row('module_type', { text: 'Planetary' }, t, 'Gear type');
    else if (/^(Ballscrew|Cross roller|Profile rail|Barrel cam)$/i.test(t)) row('module_type', { text: t }, t, 'Construction');
    else if ((m = t.match(/^(\d+) stops$/i))) row('axes', { value: num(m[1]) }, t, 'Index stations');
    else if ((m = t.match(/^(\d+)mm PCD$/i))) row('diameter', { value: num(m[1]), unit: 'mm' }, t, 'Pitch-circle diameter');
    else if ((m = t.match(/^size\s*(\d+)$/i))) row('diameter', { value: num(m[1]), unit: 'mm' }, t, 'Rail size');
    else if (/^preload\s*\w+$/i.test(t)) row('tolerance', { text: t }, t, 'Preload class');
    else if ((m = t.match(/^C(\d) grade$/i))) row('tolerance', { text: `C${m[1]} lead accuracy grade` }, t);
    else if ((m = t.match(/^(\d+)mm dia$/i))) row('diameter', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^(\d+)mm lead$/i))) row('gear_ratio', { value: num(m[1]), unit: 'mm/rev' }, t, 'Screw lead');
    else if ((m = t.match(/^±\s*(\d+(?:\.\d+)?)\s*°C$/))) row('temperature_stability', { value: num(m[1]), unit: '°C' }, t);
    else if (/water-water|water-air/i.test(t)) row('cooling_method', { text: t }, t);
    else if (/^i[3579]$/i.test(t)) row('cpu', { text: `Intel Core ${t}` }, t);
    else if ((m = t.match(/^(\d+)GB$/i))) row('ram', { value: num(m[1]), unit: 'GB' }, t);
    else if ((m = t.match(/^(\d+)GB SSD$/i))) row('storage', { value: num(m[1]), unit: 'GB' }, t);
    else if ((m = t.match(/^(\d+)x GigE$/i))) row('connector', { text: `${m[1]} × GigE` }, t, 'Network ports');
    else if (/^(6063|6061)\s*T6$|^AISI\s*\d+$|^IS\s*2062|^Black granite$|^Fused silica$|^A2-70/i.test(t)) row('material', { text: t }, t);
    else if (/anodised|mill finish|2B finish|lapped|ground/i.test(t)) row('surface_finish', { text: t }, t);
    else if (/AR coated/i.test(t)) row('coating', { text: t }, t);
    else if ((m = t.match(/^(\d+(?:\.\d+)?)\s*mm$/)) && productType === 'raw_material') row('thickness', { value: num(m[1]), unit: 'mm' }, t);
    else if ((m = t.match(/^(\d+)x(\d+)(?: slot (\d+))?$/)) && productType === 'raw_material') row('dimensions', { text: `${m[1]} × ${m[2]} mm profile${m[3] ? `, slot ${m[3]}` : ''}` }, t);
    else if (/^Grade\s*\d/i.test(t)) row('tolerance', { text: t }, t, 'Flatness grade');
    else if (/^E250|Gr\.?B$/i.test(t)) row('material', { text: t }, t, 'Grade');
    else if (/^servo$/i.test(t)) row('encoder_type', { text: 'Servo-driven' }, t, 'Drive');
    else if (/^sealed$|^RF excited$/i.test(t)) row('module_type', { text: t }, t, 'Construction');
    else if (/coax camera|weld monitor/i.test(t)) row('sensors', { text: t }, t);
    else if (/QBH input/i.test(t)) row('connector', { text: t }, t);
    else if (/^hardened$|^h6$|^assorted$|SHCS|pcs$/i.test(t)) row('tolerance', { text: t }, t, 'Detail');
    else if (/shielded|glands|servo \+/i.test(t)) row('connector', { text: t }, t, 'Cable detail');
    if (out.length === before) row('other', { text: t }, t, 'Other stated specification');
  }
  return out;
}

/* ------------------------------------------------------------ supplier linkage */

export interface SupplierDetail {
  supplier?: Supplier & AnyRecord;
  company?: AnyRecord;
  name: string | null;
  fields: [string, string | null][];
  notes: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/\b(india|gmbh|pvt|ltd|limited|inc|co)\b/g, '').replace(/[^a-z0-9]/g, '');

/** Category families a supplier category is expected to cover — used only to flag assignments for review. */
const VENDOR_FIT: Record<string, RegExp> = {
  'Laser Source': /laser/i,
  'Optics & Scanner': /galvo|scanner|optic/i,
  Motion: /motion|linear|standard parts/i,
  Robotics: /cobot|robot/i,
  'Vision & Sensor': /sensor|vision/i,
  Electrical: /plc|drive|electrical|enclosure/i,
  'Enclosure & Panel': /enclosure|fabrication/i,
  Safety: /sensor|plc|drive|safety|standard parts/i,
  Pneumatics: /pneumatic/i,
  'Raw Material': /standard parts|fabrication/i,
  Hardware: /standard parts/i,
  Consumable: /standard parts|enclosure|plc|drive/i,
};

export function findSupplier(name: string | undefined, records: AnyRecord[]): (Supplier & AnyRecord) | undefined {
  if (!name) return undefined;
  const k = norm(name);
  return records.find((r) => r.entity === 'supplier' && norm(r.name) === k) as (Supplier & AnyRecord) | undefined;
}

export function findCompany(name: string | undefined, records: AnyRecord[], companyId?: string): AnyRecord | undefined {
  if (companyId) return records.find((r) => r.id === companyId);
  if (!name) return undefined;
  const k = norm(name);
  return records.find((r) => r.entity === 'company' && (norm(r.name) === k || norm(String(r.brand ?? '')) === k));
}

export function supplierDetail(vendor: string | undefined, category: string | undefined, records: AnyRecord[]): SupplierDetail {
  const supplier = findSupplier(vendor, records);
  const company = findCompany(vendor, records, supplier?.company_id);
  const notes: string[] = [];
  if (!vendor) notes.push('No vendor recorded for this component.');
  else if (!supplier) notes.push(`“${vendor}” has no supplier record yet — create one to track lead time, terms and risk.`);
  const fit = category ? VENDOR_FIT[category] : undefined;
  if (supplier && fit && supplier.category && !fit.test(supplier.category)) notes.push(`Vendor category “${supplier.category}” does not usually cover “${category}” — verify the vendor assignment with Procurement.`);
  const s = supplier as (Supplier & AnyRecord) | undefined;
  return {
    supplier: s,
    company,
    name: vendor ?? null,
    notes,
    fields: [
      ['Supplier category', s?.category ?? null],
      ['Country', s?.country ?? (company?.country as string | undefined) ?? null],
      ['India presence', s?.india_presence ?? (company?.india_presence as string | undefined) ?? null],
      ['Typical lead time', s?.typical_lead_time ?? null],
      ['Payment terms', s?.payment_terms ?? null],
      ['MOQ (supplier)', s?.moq ?? null],
      ['Certifications', s?.certifications?.length ? s.certifications.join(', ') : null],
      ['Service', s?.service ?? null],
      ['Supplier risk', s?.supplier_risk && s.supplier_risk !== 'Unknown' ? s.supplier_risk : null],
      ['Technologies (company)', Array.isArray(company?.technologies) ? (company!.technologies as string[]).join(', ') : null],
      ['Website', (company?.website as string | undefined) ?? null],
    ],
  };
}

/* ------------------------------------------------------------ one datasheet shape for every component */

export type ComponentSource = 'Item master' | 'Engineering database' | 'Laser source class' | 'F-theta objective' | 'Automation module';

export interface ComponentSheet {
  id: string;
  name: string;
  source: ComponentSource;
  productType: string;
  typeLabel: string;
  category: string;
  specs: ParsedSpec[];
  missing: string[];
  completeness: number | null;
  vendor: string | null;
  supplier: SupplierDetail;
  commercial: [string, string | null][];
  dataType?: string;
  basisNote?: string;
}

const itemBase = (item: AnyRecord) => ({ source_id: (item.provenance as { source_id?: string } | undefined)?.source_id, evidence: `Item master ${String(item.code)} — specification text`, confidence: 'LOW' as const, retrieved_at: (item.provenance as { retrieved_at?: string } | undefined)?.retrieved_at });

function sheetCompleteness(productType: string, specs: SpecValue[]) {
  const keys = ITEM_KEY_SPECS[productType] ?? [];
  if (!keys.length) return { missing: [], pct: null };
  const have = new Set(specs.map((s) => s.spec));
  const missing = keys.filter((k) => !have.has(k));
  return { missing, pct: Math.round(((keys.length - missing.length) / keys.length) * 100) };
}

export function itemSheet(item: ItemMaster & AnyRecord, records: AnyRecord[]): ComponentSheet {
  const pt = itemProductType(item);
  const specs = parseSpecText(item.spec, pt, itemBase(item));
  const c = sheetCompleteness(pt, specs);
  return {
    id: item.id,
    name: item.name,
    source: 'Item master',
    productType: pt,
    typeLabel: productTypeLabel(pt) === pt ? pt.replace(/_/g, ' ').replace(/^./, (x) => x.toUpperCase()) : productTypeLabel(pt),
    category: item.category,
    specs,
    missing: c.missing,
    completeness: c.pct,
    vendor: item.vendor ?? null,
    supplier: supplierDetail(item.vendor, item.category, records),
    commercial: [
      ['Stock code', item.code],
      ['Item class', item.item_class],
      ['Unit of measure', item.uom],
      ['Price', item.price != null ? `${item.currency} ${item.price.toLocaleString('en-IN')}` : null],
      ['Price basis', item.price_basis],
      ['Price date', item.price_date ?? null],
      ['Lead time', item.lead_time_weeks != null ? `${item.lead_time_weeks} weeks` : null],
      ['MOQ', item.moq != null ? String(item.moq) : null],
      ['HSN code', item.hsn ?? null],
      ['Status', (item.status as string | undefined) ?? null],
    ],
    dataType: item.data_type,
    basisNote: 'Specification text, vendor, price and lead time are legacy cost-platform seed values (DEMO) until confirmed by TEAL Procurement / Engineering.',
  };
}

export function partSheet(part: Part & AnyRecord, records: AnyRecord[], byId: Map<string, AnyRecord>): ComponentSheet {
  const c = completeness(part);
  const maker = part.manufacturer_id ? byId.get(part.manufacturer_id) : undefined;
  const prices = [...(part.prices ?? [])].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
  const p = prices[0];
  const supRec = p?.supplier_id ? byId.get(p.supplier_id) : undefined;
  const vendor = supRec?.name ?? maker?.name ?? null;
  const sd = supplierDetail(vendor ?? undefined, undefined, records);
  if (maker && !sd.company) sd.company = maker;
  return {
    id: part.id,
    name: part.name,
    source: 'Engineering database',
    productType: part.product_type,
    typeLabel: productTypeLabel(part.product_type),
    category: part.category ?? productTypeLabel(part.product_type),
    specs: part.specs ?? [],
    missing: c.missing,
    completeness: c.pct,
    vendor,
    supplier: sd,
    commercial: [
      ['Manufacturer', maker?.name ?? part.brand ?? null],
      ['Model number', part.model_number],
      ['Lifecycle', part.lifecycle_status],
      ['Country of origin', part.country_of_origin ?? (maker?.country as string | undefined) ?? null],
      ['Price', p ? `${p.currency} ${p.price.toLocaleString('en-IN')}` : null],
      ['Price basis', p?.basis ?? null],
      ['Price date', p?.date ?? null],
      ['Lead time', p?.lead_time_weeks != null ? `${p.lead_time_weeks} weeks` : null],
      ['MOQ', p?.moq != null ? String(p.moq) : null],
    ],
    dataType: part.data_type,
  };
}

function classSheet(r: AnyRecord, source: ComponentSource, productType: string, specs: SpecValue[], records: AnyRecord[], commercial: [string, string | null][]): ComponentSheet {
  const c = sheetCompleteness(productType, specs);
  return {
    id: r.id,
    name: r.name,
    source,
    productType,
    typeLabel: productTypeLabel(productType),
    category: source,
    specs,
    missing: c.missing,
    completeness: c.pct,
    vendor: (r.manufacturer as string | null | undefined) ?? null,
    supplier: supplierDetail((r.manufacturer as string | undefined) ?? undefined, undefined, records),
    commercial,
    dataType: r.data_type,
    basisNote: 'A TEAL configurator option (technology class), not a specific manufacturer model — manufacturer and supplier are selected per project.',
  };
}

const sv = (r: AnyRecord, spec: string, v: Partial<SpecValue>, original?: string): SpecValue => ({ spec, ...v, original: original ?? (v.value != null ? `${v.value} ${v.unit ?? ''}`.trim() : v.text), source_id: (r.provenance as { source_id?: string } | undefined)?.source_id, evidence: (r.provenance as { section?: string } | undefined)?.section, confidence: 'MEDIUM', extraction_status: 'EXTRACTED' });

/** Every component the platform holds, as datasheets. */
export function allComponentSheets(records: AnyRecord[], byId: Map<string, AnyRecord>, only?: string): ComponentSheet[] {
  const out: ComponentSheet[] = [];
  for (const r of only ? [byId.get(only)].filter((x): x is AnyRecord => !!x) : records) {
    if (r.entity === 'component') out.push(itemSheet(r as ItemMaster & AnyRecord, records));
    else if (r.entity === 'part') out.push(partSheet(r as unknown as Part & AnyRecord, records, byId));
    else if (r.entity === 'laser_source' && r.kind === 'class') {
      const w = r.wavelength as { value?: number; unit?: string; original?: string } | undefined;
      const pd = r.pulse_duration as { value?: number; unit?: string; original?: string } | undefined;
      const rr = r.repetition_rate_khz as number[] | null | undefined;
      const specs = [
        w?.value != null ? sv(r, 'wavelength', { value: w.value, unit: w.unit }, w.original) : null,
        pd?.value != null ? sv(r, 'pulse_width', { value: pd.value, unit: pd.unit }, pd.original) : null,
        rr?.length === 2 ? sv(r, 'repetition_rate_range', { min: rr[0], max: rr[1], unit: 'kHz' }, `${rr[0]}–${rr[1]} kHz`) : null,
        r.m2 != null ? sv(r, 'm2', { value: r.m2 as number }) : null,
        r.beam_diameter_mm != null ? sv(r, 'beam_diameter', { value: r.beam_diameter_mm as number, unit: 'mm' }) : null,
        r.mode ? sv(r, 'modulation', { text: String(r.mode) }) : null,
      ].filter((x): x is SpecValue => !!x);
      out.push(classSheet(r, 'Laser source class', 'laser_source', specs, records, [['Wall-plug efficiency', r.wall_plug_efficiency != null ? `${Math.round((r.wall_plug_efficiency as number) * 100)} %` : null], ['Configurator price factor', r.price_premium != null ? `× ${r.price_premium}` : null]]));
    } else if (r.entity === 'optic' && r.optic_type === 'f_theta') {
      const specs = [r.focal_length_mm != null ? sv(r, 'focal_length', { value: r.focal_length_mm as number, unit: 'mm' }) : null, r.scan_field_mm != null ? sv(r, 'scan_field_x', { value: r.scan_field_mm as number, unit: 'mm' }) : null].filter((x): x is SpecValue => !!x);
      out.push(classSheet(r, 'F-theta objective', 'f_theta', specs, records, [['Short code', (r.short_code as string) ?? null]]));
    } else if (r.entity === 'module') {
      const s = classSheet(r, 'Automation module', 'module', [], records, [['Group', (r.group as string) ?? null], ['Price estimate', r.price_estimate_inr != null ? `INR ${(r.price_estimate_inr as number).toLocaleString('en-IN')} (configurator ESTIMATE)` : null]]);
      s.basisNote = 'Configurator module (function). Interfaces, utilities, accuracy and suppliers are UNKNOWN until documented.';
      out.push(s);
    }
  }
  return out;
}

export function sheetFor(id: string, records: AnyRecord[], byId: Map<string, AnyRecord>): ComponentSheet | undefined {
  return allComponentSheets(records, byId, id)[0];
}
