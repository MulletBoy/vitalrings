"""Sets the version everywhere it is written down.

Usage: python scripts/bump-version.py 1.2.3
Then rebuild the card (cd card && npm run build) so the bundle carries it.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    if len(sys.argv) != 2 or not re.fullmatch(r"\d+\.\d+\.\d+", sys.argv[1]):
        sys.exit("usage: bump-version.py MAJOR.MINOR.PATCH")
    version = sys.argv[1]

    manifest = ROOT / "custom_components/vital_rings/manifest.json"
    data = json.loads(manifest.read_text())
    data["version"] = version
    manifest.write_text(json.dumps(data, indent=2) + "\n")

    package = ROOT / "card/package.json"
    data = json.loads(package.read_text())
    data["version"] = version
    package.write_text(json.dumps(data, indent=2) + "\n")

    lock = ROOT / "card/package-lock.json"
    data = json.loads(lock.read_text())
    data["version"] = version
    data["packages"][""]["version"] = version
    lock.write_text(json.dumps(data, indent=2) + "\n")

    card = ROOT / "card/src/vital-rings-card.ts"
    text, count = re.subn(
        r'export const CARD_VERSION = "[^"]+";',
        f'export const CARD_VERSION = "{version}";',
        card.read_text(),
    )
    if count != 1:
        sys.exit("CARD_VERSION not found in the card source")
    card.write_text(text)
    print("version set to", version)


if __name__ == "__main__":
    main()
