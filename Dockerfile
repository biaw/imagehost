FROM node:16-alpine@sha256:aadb411a5d398d2141f36a61f469ab91b971e43988d6c74aa5204986e5fe18a1
RUN apk add dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . ./
RUN npm run build

ENV PORT=80
EXPOSE 80

CMD ["dumb-init", "npm", "start"]