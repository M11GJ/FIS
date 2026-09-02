FROM node:20-alpine AS frontend-build

WORKDIR /app

# DCC Login is a Public Client. These values are public build-time settings;
# no Client Secret is embedded in the browser bundle.
ARG VITE_DCC_CLIENT_ID="dcc_fy43DvLjb9qCQCiXE857GXGP"
ARG VITE_DCC_REDIRECT_URI="https://fis--gunn0511.shu-dcc.net/shu-binran/"
ARG VITE_DCC_SCOPES="openid profile"
ENV VITE_DCC_CLIENT_ID=$VITE_DCC_CLIENT_ID
ENV VITE_DCC_REDIRECT_URI=$VITE_DCC_REDIRECT_URI
ENV VITE_DCC_SCOPES=$VITE_DCC_SCOPES

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
COPY shared ./shared
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV FIS_PUBLIC_DIR=/app/public
ENV FIS_DATA_PATH=/data/course-profiles.json
ENV DCC_OIDC_CLIENT_ID=dcc_fy43DvLjb9qCQCiXE857GXGP

COPY admin-api/package*.json ./admin-api/
RUN cd admin-api && npm ci --omit=dev

COPY admin-api/*.js ./admin-api/
COPY shared ./shared
COPY src/data/courses_info.json ./src/data/courses_info.json
COPY --from=frontend-build /app/dist ./public

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "admin-api/fisServer.js"]
