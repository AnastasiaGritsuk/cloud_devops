FROM node:14-alpine as base

WORKDIR /home/node/app
COPY package.json ./
COPY tsconfig.json ./
COPY static ./
COPY . .
RUN npm i

FROM base as production

WORKDIR /home/node/app
RUN npm run build
RUN rm -rf node_modules
RUN npm install --production

