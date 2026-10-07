// An ffmpeg filter description separates options with ':', so a Windows drive
// letter ("C:/Windows/...") silently breaks the parse. The filtergraph is
// unescaped twice, so the separator needs two backslashes, not one — a single
// backslash still fails to parse. Verified against ffmpeg 8 on Windows.
export function escapeFilterValue(value) {
  return String(value)
    .replace(/\\/g, '/')
    .replace(/'/g, "\\\\'")
    .replace(/:/g, '\\\\:');
}

export function frameImageArgs({ textPath, outputPath, doc, fontFile, cellWidth = 8, cellHeight = 16 }) {
  const width = doc.cols * cellWidth;
  const height = doc.rows * cellHeight;
  const drawtext = [
    `textfile=${escapeFilterValue(textPath)}`,
    `fontfile=${escapeFilterValue(fontFile)}`,
    `fontsize=${cellHeight}`,
    'fontcolor=white',
    'x=0',
    'y=0',
    'line_spacing=0',
  ].join(':');
  return [
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=black:s=${width}x${height}:d=1`,
    '-vf', `drawtext=${drawtext}`,
    '-frames:v', '1',
    outputPath,
  ];
}

export function gifAssembleArgs({ frameGlob, fps, outputPath }) {
  return [
    '-y',
    '-framerate', String(fps),
    '-i', frameGlob,
    '-filter_complex', '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer',
    '-loop', '0',
    outputPath,
  ];
}

// ---------------------------------------------------------------------------
// The colour path
// ---------------------------------------------------------------------------
//
// `drawtext` cannot carry per-cell colour, so the colour path does not use it.
// Cells are rasterised here as rectangle fills — every glyph the converter
// emits is an axis-aligned partition of its cell — and handed to ffmpeg as raw
// RGB. No font file, no glyph metrics, and nothing to escape.

export function rawVideoArgs({ rawPath, width, height, fps, outputPath, frames = null }) {
  const args = [
    '-y',
    '-v', 'error',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', `${width}x${height}`,
    '-r', String(fps),
    '-i', rawPath,
  ];
  if (frames !== null) args.push('-frames:v', String(frames));
  if (outputPath.endsWith('.gif')) {
    args.push(
      '-filter_complex',
      '[0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer',
      '-loop', '0',
    );
  }
  args.push(outputPath);
  return args;
}

export function tileArgs({ rawPath, width, height, columns, rows, outputPath }) {
  return [
    '-y',
    '-v', 'error',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-s', `${width}x${height}`,
    '-i', rawPath,
    '-vf', `tile=${columns}x${rows}`,
    '-frames:v', '1',
    outputPath,
  ];
}

export function planGif({ doc, framesDir, outputPath, fontFile, cellWidth, cellHeight }) {
  const commands = doc.frames.map((_frame, index) => ({
    command: 'ffmpeg',
    args: frameImageArgs({
      textPath: `${framesDir}/f${String(index).padStart(4, '0')}.txt`,
      outputPath: `${framesDir}/f${String(index).padStart(4, '0')}.png`,
      doc,
      fontFile,
      cellWidth,
      cellHeight,
    }),
  }));
  commands.push({
    command: 'ffmpeg',
    args: gifAssembleArgs({ frameGlob: `${framesDir}/f%04d.png`, fps: doc.fps, outputPath }),
  });
  return { commands };
}

export async function renderGif(options, { ffmpegAvailable, run, print = false }) {
  const { commands } = planGif(options);
  if (!ffmpegAvailable) {
    const note = 'ffmpeg is not available, so no GIF was rendered. kai never installs tools for you.';
    if (print) {
      return { status: 'printed', outputPath: null, notes: [note], commands };
    }
    return {
      status: 'blocked',
      outputPath: null,
      notes: [note, 'Re-run with --print to prepare the commands for a host that has ffmpeg.'],
      commands,
    };
  }
  const notes = [];
  for (const entry of commands) {
    const result = await run(entry.command, entry.args);
    if (result.code !== 0) {
      notes.push(`ffmpeg failed: ${(result.stderr || result.stdout || `exit ${result.code}`).trim()}`);
      return { status: 'blocked', outputPath: null, notes, commands };
    }
  }
  return { status: 'ok', outputPath: options.outputPath, notes, commands: [] };
}
