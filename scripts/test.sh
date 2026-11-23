#!/bin/sh
# Install the test requirements (quick once cached) and run the tests.
set -e
pip install --quiet --disable-pip-version-check --root-user-action=ignore -r requirements-test.txt
# A local, untracked .devcmd replaces the test run (for one-off checks in the container).
if [ -f .devcmd ]; then exec sh .devcmd; fi
exec python -m pytest -p no:cacheprovider "$@"
