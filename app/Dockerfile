FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SOLANA_RPC_URL=https://api.testnet.solana.com
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_SOLANA_NETWORK=testnet
ENV VITE_SOLANA_RPC_URL=$VITE_SOLANA_RPC_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html/scstobcminority-ai
RUN printf 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /scstobcminority-ai/index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
