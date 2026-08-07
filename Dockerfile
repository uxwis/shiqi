FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .
RUN mkdir -p /data/uploads && chown -R node:node /data

USER node
EXPOSE 4173

CMD ["npm", "start"]
