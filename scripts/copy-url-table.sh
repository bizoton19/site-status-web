#!/usr/bin/env bash
# Wrapper: uses Azure CLI for connection strings, Python for Table API copy.
#
#   chmod +x scripts/copy-url-table.sh
#   pip install -r scripts/requirements-tools.txt
#   az login
#   ./scripts/copy-url-table.sh
#   ./scripts/copy-url-table.sh --dry-run
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec python3 "$ROOT/scripts/copy_url_table.py" "$@"
