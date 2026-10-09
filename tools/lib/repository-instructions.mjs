export const OPEN_REPOSITORY_INSTRUCTIONS =
  '<!-- >>> kai repository instructions (managed by workflow-workspace-init) >>> -->';
export const CLOSE_REPOSITORY_INSTRUCTIONS =
  '<!-- <<< kai repository instructions <<< -->';

export function extractRepositoryInstructions(raw) {
  const openIndex = raw.indexOf(OPEN_REPOSITORY_INSTRUCTIONS);
  if (openIndex === -1) return null;

  const closeIndex = raw.indexOf(
    CLOSE_REPOSITORY_INSTRUCTIONS,
    openIndex + OPEN_REPOSITORY_INSTRUCTIONS.length,
  );
  if (closeIndex === -1) return null;

  const closeEnd = closeIndex + CLOSE_REPOSITORY_INSTRUCTIONS.length;
  const lineEnd = raw.indexOf('\n', closeEnd);
  return raw.slice(openIndex, lineEnd === -1 ? raw.length : lineEnd + 1);
}
