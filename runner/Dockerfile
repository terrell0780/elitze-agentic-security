FROM golang:1.26-alpine AS nuclei-build

# Go proxy connections can reset during the large Nuclei dependency download.
# Retry transient fetch/checksum failures; do not skip checksum verification.
RUN set -eux; \
    for attempt in 1 2 3; do \
      if CGO_ENABLED=0 GOPROXY=https://proxy.golang.org,direct GOSUMDB=sum.golang.org go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@v3.11.1; then \
        exit 0; \
      fi; \
      if [ "$attempt" -lt 3 ]; then sleep $((attempt * 10)); fi; \
    done; \
    echo "Nuclei build failed after three attempts" >&2; \
    exit 1

FROM node:22-alpine
RUN apk add --no-cache ca-certificates
COPY --from=nuclei-build /go/bin/nuclei /usr/local/bin/nuclei
WORKDIR /app
COPY server.mjs scope-policy.mjs /app/
USER node
ENV PORT=8787
EXPOSE 8787
CMD ["node", "/app/server.mjs"]
