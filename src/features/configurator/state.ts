import type { Configuration } from '../../domain/entities';
import type { ConfigState } from './engine';

/** Saved configuration record → configurator engine state (pure; shared by pages and services). */
export function stateFromConfiguration(c: Configuration): ConfigState {
  return { productKey: c.product_id.replace(/^prd-/, ''), appKey: c.application_key, sourceKey: c.source_key, powerW: c.power_w, lensKey: c.lens_key, modules: c.modules, extras: c.extras, software: c.software, targetPerHour: c.target_per_hour };
}
