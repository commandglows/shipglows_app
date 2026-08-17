# Astro Web image is not buildable or routable

This directory intentionally contains no Dockerfile. C2 records only verified
tool versions, the official Node archive checksum, immutable runtime policy,
and the fixture-lock binding.

The approved registry stage must resolve an immutable `linux/amd64` base digest,
the pnpm artifact digest, a private VCR repository, the complete offline store,
the final OCI digest, SBOM, provenance, vulnerability result, and retirement
time. Until every blocker in `image-plan.json` is replaced by evidence, routing
must reject this image and no source may execute.
