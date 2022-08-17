FROM node:16-alpine@sha256:9a69aeb1cc34fb8817fe4851fee08ec20fdd432ca03077a9f195aee79a24e8cc
RUN apk add dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm i

COPY . ./
RUN npm run build

ENV PORT=80
EXPOSE 80

CMD ["dumb-init", "npm", "start"]