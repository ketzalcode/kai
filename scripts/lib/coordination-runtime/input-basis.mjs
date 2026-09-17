import {createHash} from 'node:crypto';
import {canonicalJson, criteriaRef} from './contract.mjs';
import {fail, hashArtifact, pathPrivacy, verifyArtifact} from './evidence-content.mjs';

const digest = value => createHash('sha256').update(canonicalJson(value)).digest('hex');
export const privacyRank = {public: 0, internal: 1, confidential: 2, personal: 3};

/** Context references may cross item boundaries; verdict evidence may not.
 * Retain identities/revisions, not a duplicate design/brief body. Verification
 * walks only the selected input graph and actual bytes, never all history.
 */
export function captureInputBasis(context, tx, references, seen = new Set(), observe) {
  return [...new Set(references)].sort().map(reference => {
    if (seen.has(reference)) fail('EVIDENCE_GAP', 'applicable inputs contain a cycle');
    const next = new Set([...seen, reference]);
    const match = /^(artifact|asset|evidence):([0-9a-f-]+)$/i.exec(reference);
    if (!match) {
      const subject = hashArtifact({root: context.root, relativePath: reference});
      observe?.({subject, classification: pathPrivacy(context.root, subject.path)});
      return {reference, digest: digest(subject)};
    }
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!record) fail('EVIDENCE_GAP', `applicable input ${reference} is missing`);
    if (kind === 'artifact') {
      verifyArtifact(context.root, record.body);
      observe?.(record.body);
      if (record.body.input_basis === undefined) {
        fail('EVIDENCE_GAP', `applicable input ${reference} has unknown captured lineage; register a fresh explicit input basis`);
      }
      verifyInputBasis(context, tx, record.body.input_basis, next, observe);
    } else if (kind === 'asset') {
      captureInputBasis(context, tx, [`artifact:${record.body.artifact_id}`,
        ...record.body.input_asset_ids.map(id => `asset:${id}`)], next, observe);
    } else {
      captureInputBasis(context, tx, record.body.evidence_refs, next, observe);
    }
    const owner = tx.get('item', record.itemId);
    if (!owner) fail('EVIDENCE_GAP', `applicable input ${reference} has no owning item`);
    return {reference, digest: digest({record, ownerCriteria: criteriaRef(owner.body)})};
  });
}

export function verifyInputBasis(context, tx, basis, seen = new Set(), observe) {
  if (canonicalJson(captureInputBasis(context, tx, basis.map(b => b.reference), seen, observe)) !== canonicalJson(basis)) {
    fail('EVIDENCE_GAP', 'applicable design/brief/input revision changed; register a fresh output basis and independent acceptance');
  }
}

export function inputBasisCurrent(context, tx, basis) {
  try { verifyInputBasis(context, tx, basis); return true; }
  catch (error) {
    if (error.code !== 'EVIDENCE_GAP') throw error;
    return false;
  }
}

export function artifactInputReferences(item, inputAssetIds) {
  return [...item.context_artifacts, ...inputAssetIds.map(id => `asset:${id}`)];
}
