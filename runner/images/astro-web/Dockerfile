# syntax=docker/dockerfile:1.7@sha256:a57df69d0ea827fb7266491f2813635de6f17269be881f696fbfdf2d83dda33e

FROM node:24.19.0-trixie-slim@sha256:0711b541c1c33a8a530ac4f0d391baa9a15b3d804695b1b24a47daa5fb60e74d AS cache

ARG SOURCE_DATE_EPOCH=0
ENV CI=1 \
    HOME=/tmp/shipglows-home \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    PNPM_HOME=/opt/shipglows/pnpm \
    PNPM_STORE_DIR=/opt/shipglows/pnpm-store \
    TZ=UTC \
    npm_config_store_dir=/opt/shipglows/pnpm-store

ADD --checksum=sha256:772f8e00f719afbbe22502717cf974578804630d02e757eb3debbc08a0f8f83a \
    https://registry.npmjs.org/pnpm/-/pnpm-11.15.0.tgz /tmp/pnpm-11.15.0.tgz

RUN npm install --global --ignore-scripts /tmp/pnpm-11.15.0.tgz \
    && test "$(pnpm --version)" = "11.15.0" \
    && rm -f /tmp/pnpm-11.15.0.tgz \
    && mkdir -p /seed /verify /opt/shipglows/pnpm /opt/shipglows/pnpm-store

WORKDIR /seed
COPY --from=fixture /pnpm-lock.yaml /pnpm-workspace.yaml ./
RUN pnpm --config.offline=false fetch --frozen-lockfile --ignore-scripts

COPY --from=fixture /package.json /.npmrc /verify/
COPY --from=fixture /pnpm-lock.yaml /pnpm-workspace.yaml /verify/
WORKDIR /verify
RUN pnpm install --offline --frozen-lockfile --ignore-scripts \
    && rm -rf /verify

FROM node:24.19.0-trixie-slim@sha256:0711b541c1c33a8a530ac4f0d391baa9a15b3d804695b1b24a47daa5fb60e74d

ARG SOURCE_DATE_EPOCH=0
LABEL org.opencontainers.image.title="ShipGlows Astro Web toolchain" \
      org.opencontainers.image.version="node-24.19.0_pnpm-11.15.0" \
      org.opencontainers.image.vendor="ShipGlows"

ENV CI=1 \
    HOME=/tmp/shipglows-home \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    PNPM_HOME=/opt/shipglows/pnpm \
    PNPM_STORE_DIR=/opt/shipglows/pnpm-store \
    TZ=UTC \
    npm_config_store_dir=/opt/shipglows/pnpm-store

COPY --from=cache /usr/local/lib/node_modules/pnpm /usr/local/lib/node_modules/pnpm
COPY --from=cache /usr/local/bin/pnpm /usr/local/bin/pnpm
COPY --from=cache --chown=65532:65532 /opt/shipglows/pnpm-store /opt/shipglows/pnpm-store

RUN printf 'shipglows:x:65532:\n' >> /etc/group \
    && printf 'shipglows:x:65532:65532:ShipGlows:/tmp/shipglows-home:/bin/sh\n' >> /etc/passwd \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    && mkdir -p /workspace /tmp/shipglows-home /opt/shipglows/pnpm \
    && chown -R 65532:65532 /workspace /tmp/shipglows-home /opt/shipglows

WORKDIR /workspace
USER 65532:65532
CMD ["node", "--version"]
