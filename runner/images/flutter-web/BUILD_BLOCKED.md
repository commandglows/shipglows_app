# Flutter Web image is not buildable or routable

This temporary proof branch contains a Dockerfile with the canonical Flutter
archive, revision and checksum. It is a build candidate only: it remains
non-routable until the remote workflow records the private VCR repository,
final digest, web/offline caches, SBOM, provenance, vulnerability result, and
retirement time.

The workflow scans the local candidate before registry authentication, refuses
an existing immutable tag, and pushes only after a zero HIGH/CRITICAL Trivy
result. Until every remaining blocker in `image-plan.json` is replaced by
evidence, routing must reject this image and no source may execute.
