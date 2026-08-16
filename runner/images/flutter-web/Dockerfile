# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM debian:trixie-slim@sha256:3a39a0592364683e6bab97937b72cad5a8fa6dcbbee90edb3bb48c7f8e94f258 AS base

ARG SOURCE_DATE_EPOCH=0
ENV DEBIAN_FRONTEND=noninteractive \
    FLUTTER_ROOT=/opt/flutter \
    PUB_CACHE=/opt/shipglows/pub-cache \
    PATH=/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:$PATH

RUN rm -f /etc/apt/sources.list.d/debian.sources \
    && printf '%s\n' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian/20260803T000000Z trixie main' \
      'deb [check-valid-until=no] http://snapshot.debian.org/archive/debian-security/20260803T000000Z trixie-security main' \
      > /etc/apt/sources.list \
    && apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Retries=3 update \
    && apt-get install --yes --no-install-recommends ca-certificates curl git unzip xz-utils zip \
    && rm -rf /var/lib/apt/lists/*

ADD --checksum=sha256:f344d5057db52abc2a63cd3a7c7370957b7685d1fca5e5fbe2ce4dfe74657a79 \
    https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.41.7-stable.tar.xz \
    /tmp/flutter.tar.xz

RUN mkdir -p /opt/shipglows/pub-cache \
    && tar -xJf /tmp/flutter.tar.xz -C /opt \
    && rm -f /tmp/flutter.tar.xz \
    && git config --system --add safe.directory /opt/flutter \
    && flutter --version --machine | grep -Eq '"frameworkVersion"[[:space:]]*:[[:space:]]*"3\.41\.7"'

RUN flutter config --no-analytics \
    && flutter precache --web

FROM base AS cache

WORKDIR /seed
COPY --from=fixture /pubspec.yaml /pubspec.lock ./
RUN flutter pub get --enforce-lockfile

WORKDIR /verify
COPY --from=fixture /pubspec.yaml /pubspec.lock ./
RUN flutter pub get --offline --enforce-lockfile

FROM base

ARG SOURCE_DATE_EPOCH=0
LABEL org.opencontainers.image.title="ShipGlows Flutter Web toolchain" \
      org.opencontainers.image.version="flutter-3.41.7_dart-3.11.5" \
      org.opencontainers.image.vendor="ShipGlows"

ENV CI=1 \
    HOME=/tmp/shipglows-home \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    PUB_CACHE=/opt/shipglows/pub-cache \
    TZ=UTC

COPY --from=cache /opt/shipglows/pub-cache /opt/shipglows/pub-cache

RUN printf 'shipglows:x:65532:\n' >> /etc/group \
    && printf 'shipglows:x:65532:65532:ShipGlows:/tmp/shipglows-home:/bin/sh\n' >> /etc/passwd \
    && mkdir -p /workspace /tmp/shipglows-home \
    && chown -R 65532:65532 /workspace /tmp/shipglows-home /opt/flutter /opt/shipglows/pub-cache

WORKDIR /workspace
USER 65532:65532
CMD ["flutter", "--version"]
