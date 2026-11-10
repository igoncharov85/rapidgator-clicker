# Development and releases

## Local setup

```sh
git clone https://github.com/igoncharov85/rapidgator-clicker.git
cd rapidgator-clicker
npm test
```

Use Node.js 18+ for tests. No `npm install` or build step is required. Load the repository folder through Chrome's **Extensions → Developer mode → Load unpacked**. After editing, reload the extension and then reload the site tab. Pin the extension to inspect status.

## Checks

```sh
npm test
node --check flow.js
node --check content.js
node --check popup.js
git diff --check
```

The baseline suite has 12 tests covering timer gating, publisher notices, manual start status, CAPTCHA response gating, hidden/disabled controls, exact final button matching, and once-per-stage execution. Tests do not contact Rapidgator or trigger a real download.

## Manual verification

1. On a file page, enable the extension and click **Slow Speed Download** yourself. A publisher subscription banner alone does not establish that this will fail.
2. Confirm the popup reports the visible countdown, with no early click. Hidden/empty timer markup before starting must not be mistaken for an active countdown.
3. Let Rapidgator redirect after its wait. Complete any CAPTCHA yourself if needed. The extension should click Send once a response field is populated.
4. Confirm the final download button is clicked once. Check Chrome's downloads separately for actual file progress/completion.
5. Pause/resume and confirm the extension does not repeat an already attempted stage. Reload to reset actions if a submission fails.

If the status says to open/reload a Rapidgator tab, check the current page domain, the extension's site access, and whether the tab predates installation or an extension reload. If it waits on a CAPTCHA despite visible success, inspect whether the site has changed the response field names. If it misses a final download button, inspect the actual control label and visibility before changing the exact-label rule.

Prefer relevant Chrome extension errors and sanitized DOM snippets for debugging. Avoid collecting credentials, CAPTCHA tokens, full page dumps, or unrelated personal browsing information.

## Icon assets

Approved master: `icons/icon-flat-source.png`. Prior master `icons/icon-borderless-source.png` is historical, not the current input. The user approved the flat orange/black version after rejecting an outer black border and a dark orange patch.

When resizing an approved asset on macOS, preserve transparency:

```sh
for size in 16 32 48 128; do
  sips -z "$size" "$size" icons/icon-flat-source.png --out "icons/icon${size}.png"
done
```

Only regenerate artwork when requested. Icon source/provenance and prompts are documented in the README and `icons/`.

## Package a release

Set the same version in `manifest.json` and `package.json`. The following dependency-free Python 3 command validates version consistency, referenced files, and icon dimensions, then writes a ZIP with `manifest.json` at its root. It includes only the runtime and current icon source/provenance, not Git history, tests, obsolete icon variants, or existing ZIPs.

```sh
python3 - <<'PY'
import json
from pathlib import Path
import struct
import zipfile

root = Path.cwd()
manifest = json.loads((root / 'manifest.json').read_text())
package = json.loads((root / 'package.json').read_text())
assert manifest['version'] == package['version'], 'Version mismatch'
for size, name in manifest['icons'].items():
    data = (root / name).read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', name
    assert struct.unpack('>II', data[16:24]) == (int(size), int(size)), name

files = {
    'manifest.json', 'flow.js', 'content.js', 'popup.html', 'popup.css',
    'popup.js', 'README.md', 'icons/icon-flat-source.png',
    'icons/prompt-flat.txt', 'icons/rapidgator-original.ico',
    *manifest['icons'].values(), *manifest['action']['default_icon'].values(),
    manifest['action']['default_popup'],
    *(name for script in manifest['content_scripts'] for name in script['js']),
}
for name in files:
    assert (root / name).is_file(), name
destination = root / 'dist' / f"rapidgator-click-{manifest['version']}.zip"
destination.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(files):
        archive.write(root / name, name)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
    assert 'manifest.json' in archive.namelist()
print(destination)
PY
```

The ZIP is an unpacked-extension distribution: extract it and use **Load unpacked**. It is not a signed `.crx` or a Chrome Web Store publication. Existing installations loaded from this repository only need an extension reload; the ZIP is for distribution. Generated ZIPs are intentionally excluded from Git.

## Git workflow

`origin` is `https://github.com/igoncharov85/rapidgator-clicker.git`; `main` tracks `origin/main`. Review the diff and working tree before committing. Push only when requested or otherwise authorized for the task. Do not force-push or discard unrelated edits.
