FROM golang:1.26-alpine AS nuclei-build
ARG NUCLEI_TEMPLATES_REF=17f5725dc10ced09f464dd2d255c19957aad51e7
RUN apk add --no-cache git ca-certificates
RUN CGO_ENABLED=0 go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@v3.11.1
RUN git init /tmp/nuclei-templates \
    && git -C /tmp/nuclei-templates remote add origin https://github.com/projectdiscovery/nuclei-templates.git \
    && git -C /tmp/nuclei-templates config core.sparseCheckout true \
    && printf '/http/\n' > /tmp/nuclei-templates/.git/info/sparse-checkout \
    && git -C /tmp/nuclei-templates fetch --depth 1 --filter=blob:none origin "${NUCLEI_TEMPLATES_REF}" \
    && git -C /tmp/nuclei-templates checkout --detach FETCH_HEAD \
    && test -s /tmp/nuclei-templates/http/misconfiguration/ace-admin-dashboard.yaml \
    && rm -rf /tmp/nuclei-templates/.git

FROM node:22-alpine
ARG NUCLEI_TEMPLATES_REF=17f5725dc10ced09f464dd2d255c19957aad51e7
RUN apk add --no-cache ca-certificates
COPY --from=nuclei-build /go/bin/nuclei /usr/local/bin/nuclei
COPY --from=nuclei-build --chown=node:node /tmp/nuclei-templates /home/node/nuclei-templates
WORKDIR /app
COPY --chown=node:node server.mjs scope-policy.mjs /app/
USER node
ENV HOME=/home/node
ENV PORT=8787
ENV NUCLEI_TEMPLATES_REF=${NUCLEI_TEMPLATES_REF}
EXPOSE 8787
CMD ["node", "/app/server.mjs"]
