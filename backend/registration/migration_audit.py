#!/usr/bin/env python3
"""Read-only audit of registration schema versions before a v2 deployment.

This script intentionally performs no writes. It helps confirm that legacy
submissions remain present and reports whether any records already use v2.
"""

import argparse
from collections import Counter

try:
    import boto3
except ModuleNotFoundError:
    raise SystemExit(
        "boto3 is required for this read-only audit. Install it with: "
        "python3 -m pip install --user boto3 (or use the project audit venv)."
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", default="raagasudha-student-registrations")
    parser.add_argument("--region", default=None)
    args = parser.parse_args()

    dynamodb = boto3.resource("dynamodb", region_name=args.region)
    table = dynamodb.Table(args.table)
    counts = Counter()
    total = 0
    last_key = None

    while True:
        kwargs = {
            "ProjectionExpression": "registrationId,schemaVersion,#s,submittedAt",
            "ExpressionAttributeNames": {"#s": "status"},
        }
        if last_key:
            kwargs["ExclusiveStartKey"] = last_key
        result = table.scan(**kwargs)
        for item in result.get("Items", []):
            total += 1
            version = int(item.get("schemaVersion") or 1)
            counts[version] += 1
        last_key = result.get("LastEvaluatedKey")
        if not last_key:
            break

    print(f"Table: {args.table}")
    print(f"Total registrations: {total}")
    for version in sorted(counts):
        print(f"schemaVersion {version}: {counts[version]}")
    print("READ-ONLY AUDIT: no records were changed.")


if __name__ == "__main__":
    main()
