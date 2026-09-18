export const PROVENANCE_KIND = 'kai.ascii-motion-provenance/v1';
export const SUPPORTED_TIERS = Object.freeze([1, 2]);

export function buildProvenance({ tier, source, license, operator, createdAt, notes = [] }) {
  return {
    kind: PROVENANCE_KIND,
    tier,
    source: source ?? null,
    license: license ?? null,
    operator: operator ?? null,
    createdAt: createdAt ?? new Date().toISOString(),
    notes: [...notes],
  };
}

export function validateProvenance(record) {
  const errors = [];
  if (!record || record.kind !== PROVENANCE_KIND) {
    return { ok: false, errors: [`kind must be ${PROVENANCE_KIND}`] };
  }
  if (!SUPPORTED_TIERS.includes(record.tier)) {
    errors.push(`tier must be one of ${SUPPORTED_TIERS.join(', ')} in v1`);
  }
  for (const key of ['source', 'license', 'operator', 'createdAt']) {
    if (typeof record[key] !== 'string' || record[key].trim() === '') {
      errors.push(`${key} is required on every provenance record`);
    }
  }
  const haystack = `${record.source ?? ''} ${record.license ?? ''}`.toLowerCase();
  if (haystack.includes('giphy')) {
    errors.push('giphy is an excluded source: attribution is mandatory and caching is forbidden');
  }
  if (!Array.isArray(record.notes)) {
    errors.push('notes must be an array');
  }
  return { ok: errors.length === 0, errors };
}
