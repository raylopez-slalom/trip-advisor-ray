import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
})

console.log('build complete → dist/handler.js')
