export const PINNED_VERSION = '0.1.1';
export const MISSING_HINT = `pip install movie-ascii==${PINNED_VERSION}`;

export function interpretProbe({ code, stdout, stderr }) {
  if (code !== 0) {
    return {
      available: false,
      version: null,
      status: 'missing',
      notes: [
        `movie-ascii is not available (${(stderr || stdout || '').trim() || `exit ${code}`}).`,
        `Run this yourself if you want the raster path: ${MISSING_HINT}`,
      ],
    };
  }
  const match = /(\d+\.\d+\.\d+)/.exec(stdout);
  const version = match ? match[1] : null;
  if (version === PINNED_VERSION) {
    return { available: true, version, status: 'pinned', notes: [] };
  }
  return {
    available: true,
    version,
    status: 'unverified',
    notes: [
      `movie-ascii ${version ?? 'unknown'} is installed; kai pins and verifies ${PINNED_VERSION}. Output is unverified.`,
    ],
  };
}

export function createMovieAsciiBackend({ run }) {
  return {
    id: 'movie-ascii',
    version: PINNED_VERSION,
    capabilities: { formats: ['frames', 'gif'], direct: false },
    async probe() {
      const result = await run('movie-ascii', ['--version']);
      return interpretProbe(result);
    },
    async convert({ inputPath, profile, format, outputPath }) {
      const args = [
        inputPath,
        '--columns', String(profile.cols),
        '--rows', String(profile.rows),
        '--fps', String(profile.fps),
        '--format', format === 'frames' ? 'json' : 'gif',
        '--output', outputPath,
      ];
      const result = await run('movie-ascii', args);
      if (result.code !== 0) {
        throw new Error((result.stderr || result.stdout || `exit ${result.code}`).trim());
      }
      return format === 'frames' ? { framesPath: outputPath } : { outputPath };
    },
  };
}
