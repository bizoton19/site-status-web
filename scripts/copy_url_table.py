#!/usr/bin/env python3
"""
Copy all rows from one Azure Storage Table to another (same table name by default).

Uses Azure CLI only for credentials:
  az storage account show-connection-string --name <account> --query connectionString -o tsv

That requires: az login, and permission to read storage account keys (e.g. Contributor on the
resource group, or "Storage Account Key Operator Service Role").

Data plane copy uses the Python `azure-data-tables` SDK (Table API), not raw REST.

Example (use a venv if your Python is PEP 668 / externally managed):

  python3 -m venv .venv-tools && source .venv-tools/bin/activate
  pip install -r scripts/requirements-tools.txt
  az login
  python3 scripts/copy_url_table.py \\
    --src-account functionscpsc195aa \\
    --dst-account hcheckprodsa \\
    --table urlTable

Source / destination URLs for reference:
  https://functionscpsc195aa.table.core.windows.net/urlTable
  https://hcheckprodsa.table.core.windows.net/urlTable
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from typing import Any

try:
    from azure.core.exceptions import ResourceExistsError
    from azure.data.tables import TableServiceClient, UpdateMode
except ImportError:
    print(
        "Missing dependency: pip install -r scripts/requirements-tools.txt",
        file=sys.stderr,
    )
    sys.exit(1)


def az_connection_string(account: str, subscription: str | None) -> str:
    cmd = [
        "az",
        "storage",
        "account",
        "show-connection-string",
        "--name",
        account,
        "--query",
        "connectionString",
        "-o",
        "tsv",
    ]
    if subscription:
        cmd.extend(["--subscription", subscription])
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(r.returncode)
    s = (r.stdout or "").strip()
    if not s:
        print("Empty connection string from az CLI.", file=sys.stderr)
        sys.exit(1)
    return s


def strip_system_properties(entity: dict[str, Any]) -> dict[str, Any]:
    """Keep user properties + PartitionKey/RowKey; drop read-only / OData noise."""
    skip = {"Timestamp", "etag"}
    out: dict[str, Any] = {}
    for k, v in entity.items():
        if k in skip:
            continue
        if k.startswith("odata.") or "@odata" in k:
            continue
        if k == "metadata" or k == "Metadata":
            continue
        out[k] = v
    return out


def copy_table(
    src_conn: str,
    dst_conn: str,
    table: str,
    dry_run: bool,
) -> int:
    src_svc = TableServiceClient.from_connection_string(src_conn)
    dst_svc = TableServiceClient.from_connection_string(dst_conn)

    if dry_run:
        src_tc = src_svc.get_table_client(table_name=table)
        n = 0
        for _ in src_tc.list_entities():
            n += 1
        print(f"Dry run: would copy {n} entities from table {table!r}.")
        return 0

    try:
        dst_svc.create_table(table)
    except ResourceExistsError:
        pass

    src_tc = src_svc.get_table_client(table_name=table)
    dst_tc = dst_svc.get_table_client(table_name=table)

    count = 0
    for entity in src_tc.list_entities():
        payload = strip_system_properties(dict(entity))
        pk = payload.get("PartitionKey")
        rk = payload.get("RowKey")
        if pk is None or rk is None:
            print(f"Skipping entity without PartitionKey/RowKey: {payload!r}", file=sys.stderr)
            continue
        dst_tc.upsert_entity(mode=UpdateMode.REPLACE, entity=payload)
        count += 1
        if count % 50 == 0:
            print(f"Copied {count} rows...", flush=True)

    print(f"Done. Upserted {count} entities into {table!r} on destination.")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Copy Azure Table Storage urlTable between accounts.")
    p.add_argument(
        "--src-account",
        default="functionscpsc195aa",
        help="Source storage account name (default: functionscpsc195aa)",
    )
    p.add_argument(
        "--dst-account",
        default="hcheckprodsa",
        help="Destination storage account name (default: hcheckprodsa)",
    )
    p.add_argument(
        "--table",
        default="urlTable",
        help="Table name (default: urlTable)",
    )
    p.add_argument(
        "--subscription",
        "-s",
        default=None,
        help="Azure subscription id or name (optional; passed to az)",
    )
    p.add_argument(
        "--src-connection-string",
        default=None,
        help="Skip az for source; use this connection string directly",
    )
    p.add_argument(
        "--dst-connection-string",
        default=None,
        help="Skip az for destination; use this connection string directly",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Only count source rows; do not write to destination",
    )
    args = p.parse_args()

    src_conn = args.src_connection_string or az_connection_string(
        args.src_account, args.subscription
    )
    dst_conn = args.dst_connection_string or az_connection_string(
        args.dst_account, args.subscription
    )

    return copy_table(src_conn, dst_conn, args.table, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
