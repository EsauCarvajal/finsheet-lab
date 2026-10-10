import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
let output =
  '# Third-party notices / Avisos de terceros\n\nFinSheet Lab is MIT-licensed. Dependencies retain their own licenses and copyright notices. This document includes the full license notices shipped by the direct runtime dependencies in the installed, locked versions. Build and test tools are development dependencies; consult their packages and `package-lock.json`.\n\n';
for (const [name, version] of Object.entries(pkg.dependencies)) {
  const root = join('node_modules', name),
    metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  output += `## ${name} ${version}\n\nLicense: ${metadata.license ?? 'See package'}\n\n`;
  let found = false;
  for (const filename of [
    'LICENSE',
    'LICENSE.md',
    'LICENSE.txt',
    'license',
    'license.md',
    'LICENSE-MIT',
    'LICENSE-APACHE',
    'LICENSE-APACHE-2.0',
  ]) {
    try {
      const text = await readFile(join(root, filename), 'utf8');
      output += `### ${filename}\n\n\`\`\`text\n${text.trim()}\n\`\`\`\n\n`;
      found = true;
    } catch {}
  }
  if (!found && name === '@ironcalc/wasm') {
    output +=
      'IronCalc is dual licensed under MIT or Apache-2.0. FinSheet Lab uses the MIT option. Source: https://github.com/ironcalc/IronCalc\n\n';
    const response = await fetch(
      'https://raw.githubusercontent.com/ironcalc/IronCalc/879e71ddb6d4b0babaf88c21ce657e0abfecfdda/LICENSE-MIT',
    );
    if (!response.ok) throw new Error('Could not fetch the pinned IronCalc license');
    const license = await response.text();
    output += `\`\`\`text\n${license.trim()}\n\`\`\`\n\n`;
    found = true;
  }
  if (!found) throw new Error(`Missing license text for ${name}`);
}
output = output.trimEnd() + '\n';
await mkdir('public', { recursive: true });
await writeFile('THIRD_PARTY_NOTICES.md', output);
await writeFile('public/third-party-notices.txt', output);
console.log('Wrote runtime dependency license notices.');
