import {build} from 'esbuild';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';

const options = JSON.parse(process.argv[2]);
const {root, srcDir, shippedDir, pack} = options;
const sourceRoot = join(root, srcDir, pack);

function walkModules(dir, files = []) {
  for (const entry of readdirSync(dir, {withFileTypes: true})
    .sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkModules(path, files);
    else if (entry.name.endsWith('.mjs')) files.push(path);
  }
  return files;
}

const names = readdirSync(sourceRoot, {withFileTypes: true})
  .filter(entry => entry.isFile() && entry.name.endsWith('.mjs'))
  .map(entry => entry.name)
  .sort();
const libraryRoot = join(sourceRoot, 'lib');
const libraryModules = existsSync(libraryRoot) ? walkModules(libraryRoot) : [];
const injectId = `kai-runtime-inject:${pack}`;

const runtimePlugin = {
  name: 'kai-stable-runtime',
  setup(context) {
    context.onResolve({filter: /^kai-runtime-inject:/}, args =>
      args.path === injectId ? {path: injectId, namespace: 'kai-runtime'} : null);
    context.onLoad({filter: /.*/, namespace: 'kai-runtime'}, () => ({
      loader: 'js',
      resolveDir: root,
      contents: libraryModules.length
        ? libraryModules.map(path =>
          `import ${JSON.stringify(`./${relative(root, path).replace(/\\/g, '/')}`)};`)
          .join('\n')
        : 'export {};',
    }));
    context.onLoad({filter: /\.mjs$/, namespace: 'file'}, args => {
      let source = readFileSync(args.path, 'utf8');
      const eagerImports = [];
      let index = 0;
      source = source.replace(
        /import\(\s*(['"])(\.[^'"]+)\1\s*\)/g,
        (_statement, _quote, specifier) => {
          const binding = `__kaiBuildDynamic${index++}`;
          eagerImports.push(`import * as ${binding} from ${JSON.stringify(specifier)};`);
          return `Promise.resolve(${binding})`;
        },
      );
      if (!eagerImports.length) return null;
      const newline = source.startsWith('#!') ? source.indexOf('\n') + 1 : 0;
      const shebang = newline ? source.slice(0, newline) : '';
      const body = newline ? source.slice(newline) : source;
      return {
        loader: 'js',
        resolveDir: dirname(args.path),
        contents: `${shebang}${eagerImports.join('\n')}\n${body}`,
      };
    });
  },
};

const banner = "import{createRequire as __cr}from'node:module';"
  + 'const require=__cr(import.meta.url);';
let result;
try {
  result = await build({
    entryPoints: names.map(name => join(sourceRoot, name)),
    outdir: sourceRoot,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    banner: {js: banner},
    splitting: true,
    write: false,
    metafile: true,
    outExtension: {'.js': '.mjs'},
    chunkNames: `runtime-${pack}`,
    inject: [injectId],
    plugins: [runtimePlugin],
    legalComments: 'inline',
  });
} catch (error) {
  if (/Two output files share the same path/i.test(error.message)) {
    throw new Error(`${pack} bundle requires more than one shared chunk; `
      + 'each package must fit one stable shared runtime');
  }
  throw error;
}

const outputs = result.outputFiles.map(output => ({
  name: output.path.split(/[\\/]/).pop(),
  content: Buffer.from(output.contents).toString('base64'),
}));
const publicNames = new Set(names);
const shared = outputs.filter(output => !publicNames.has(output.name));
if (shared.length > 1) {
  throw new Error(`${pack} bundle emitted ${shared.length} shared runtime files; `
    + 'each package must emit at most one stable shared runtime');
}
if (shared.length === 1 && shared[0].name !== `runtime-${pack}.mjs`) {
  throw new Error(`${pack} bundle emitted unexpected shared runtime ${shared[0].name}`);
}

process.stdout.write(JSON.stringify({
  files: outputs.map(output => ({
    path: `${shippedDir}/${output.name}`,
    content: output.content,
  })),
  inputs: Object.keys(result.metafile.inputs)
    .filter(path => path !== injectId)
    .map(path => path.replace(/\\/g, '/')),
}));
