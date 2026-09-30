import * as THREE from 'three';
import type { MachineModel } from '../../../services/twin/machine';

/*
 * glTF export of the CONCEPTUAL 3D MODEL (3D master prompt §12, §132). One node per machine object,
 * named "<object name> [<id>]" and carrying its kind, layer and component id, so a CAD or review
 * tool can map it back to the scenario. Helpers (grid, labels, beams, parts in flow) are left out.
 * The file states in its metadata that it is conceptual geometry, not a manufacturing model.
 */
const EXPORTABLE = (m: THREE.Material) => m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshBasicMaterial || m instanceof THREE.MeshLambertMaterial || m instanceof THREE.MeshPhongMaterial;

export async function exportGlb(scene: THREE.Object3D, model: MachineModel, meta: { title: string; scenarioId: string; date: string }): Promise<{ blob: Blob; nodes: number }> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const byId = new Map(model.objects.map((o) => [o.id, o]));
  const root = new THREE.Group();
  root.name = meta.title;
  root.userData = {
    notice: 'CONCEPTUAL 3D MODEL — procedural representation of a simulation scenario. Not manufacturing geometry, not a CAD model; safety zones are not certified.',
    scenario: meta.scenarioId,
    exported: meta.date,
    units: 'metres',
  };
  const groups = new Map<string, THREE.Group>();
  scene.updateMatrixWorld(true);
  scene.traverseVisible((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !m.geometry?.attributes?.position) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    if (!mats.every(EXPORTABLE)) return;
    let p: THREE.Object3D | null = m;
    let id: string | undefined;
    while (p && !id) {
      id = p.userData?.id as string | undefined;
      p = p.parent;
    }
    const obj = id ? byId.get(id) : undefined;
    if (!obj) return;
    let g = groups.get(obj.id);
    if (!g) {
      g = new THREE.Group();
      g.name = `${obj.name} [${obj.id}]`;
      g.userData = { id: obj.id, kind: obj.kind, layer: obj.layer, ...(obj.stationKey ? { station: obj.stationKey } : {}), ...(obj.partId ? { component: obj.partId } : {}) };
      groups.set(obj.id, g);
      root.add(g);
    }
    const c = new THREE.Mesh(m.geometry, m.material);
    m.matrixWorld.decompose(c.position, c.quaternion, c.scale);
    g.add(c);
  });
  const out = await new GLTFExporter().parseAsync(root, { binary: true });
  return { blob: new Blob([out as ArrayBuffer], { type: 'model/gltf-binary' }), nodes: groups.size };
}
