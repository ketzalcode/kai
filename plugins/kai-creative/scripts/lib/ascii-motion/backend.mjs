export const FORMATS = Object.freeze(['frames', 'gif']);

export function negotiate(backend, format) {
  if (!FORMATS.includes(format)) {
    return { status: 'unsupported', reason: `unknown format "${format}"` };
  }
  const formats = backend?.capabilities?.formats ?? [];
  if (formats.includes(format)) return { status: 'ok' };
  if (format === 'frames' && backend?.capabilities?.direct) {
    return {
      status: 'unsupported',
      reason: `backend "${backend.id}" is direct-export only and cannot emit the frames IR the web bundle needs`,
    };
  }
  return {
    status: 'unsupported',
    reason: `backend "${backend?.id}" does not declare format "${format}"`,
  };
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const guard = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`backend timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

export async function runBackend(backend, { inputPath, profile, format, outputPath, timeoutMs = 120000 }) {
  const negotiation = negotiate(backend, format);
  if (negotiation.status !== 'ok') {
    return { status: 'unsupported', outputs: [], notes: [negotiation.reason] };
  }
  try {
    const output = await withTimeout(
      backend.convert({ inputPath, profile, format, outputPath }),
      timeoutMs,
    );
    return { status: 'ok', outputs: [output], notes: [] };
  } catch (error) {
    return { status: 'failed', outputs: [], notes: [`backend "${backend.id}" failed: ${error.message}`] };
  }
}

export function makeFakeBackend(overrides = {}) {
  return {
    id: 'fake',
    version: '0.0.0',
    capabilities: { formats: ['frames', 'gif'], direct: false },
    async probe() {
      return { available: true, version: '0.0.0', notes: [] };
    },
    async convert({ format }) {
      return format === 'frames' ? { frames: [['....']] } : { outputPath: 'fake.gif' };
    },
    ...overrides,
  };
}
