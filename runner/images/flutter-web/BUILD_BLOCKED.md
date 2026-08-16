# Flutter Web image is not buildable or routable

This directory intentionally contains no Dockerfile. C2 records the canonical
Flutter release archive, revision and checksum, immutable runtime policy, and
the fixture-lock binding without downloading or executing the SDK.

The approved registry stage must resolve an immutable `linux/amd64` glibc base
digest, precache the web artifacts and lock-bound pub store, select a private
VCR repository, and produce the final OCI digest, SBOM, provenance,
vulnerability result, and retirement time. Until every blocker in
`image-plan.json` is replaced by evidence, routing must reject this image and no
source may execute.
