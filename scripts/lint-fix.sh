#!/bin/sh
# Applies ruff's fixes and formatting using the read-only test container:
# the container fixes a copy and prints it as an archive, which is unpacked here.
# Usage (from the project root, on the machine with docker): sh scripts/lint-fix.sh
set -e
container="${VITALRINGS_TEST_CONTAINER:-vitalrings-test}"
out="$(mktemp)"
trap 'rm -f "$out" .devcmd' EXIT
run_id="lint-$(date +%s)-$$"
cat > .devcmd << EOF
mkdir -p /tmp/lint && cd /tmp/lint
cp -r /work/custom_components /work/tests /work/scripts /work/pyproject.toml .
ruff check --no-cache --fix --quiet . > /dev/null 2>&1 || true
ruff format --no-cache --quiet . > /dev/null 2>&1 || true
echo "-----ARCHIVE $run_id-----"
find custom_components tests scripts -name "*.py" | tar -cz -T - | base64 -w 0
echo
echo "-----REPORT $run_id-----"
ruff check --no-cache . 2>&1 | tail -40
ruff format --no-cache --check . 2>&1 | tail -5
EOF
docker start "$container" > /dev/null
docker wait "$container" > /dev/null
docker logs --tail 200 "$container" 2> /dev/null > "$out"
# Only this run's output counts: older runs are still in the container's log.
grep -q -- "-----REPORT $run_id-----" "$out" || {
  echo "This run's output was not found in the container log"
  exit 1
}
sed -n "/^-----ARCHIVE $run_id-----\$/{n;p;q}" "$out" | base64 -d | tar -xz
sed -n "/^-----REPORT $run_id-----\$/,\$p" "$out"
