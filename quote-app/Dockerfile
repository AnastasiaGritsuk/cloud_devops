FROM node:14-alpine
#ARG BASE_IMAGES_REGISTRY="136433206089.dkr.ecr.us-east-1.amazonaws.com"
#ARG BASE_IMAGES_REPOSITORY="base-images"
#ARG BASE_NODE_IMAGE_TAG="node-14.1.0-alpine"
#
#FROM $BASE_IMAGES_REGISTRY/$BASE_IMAGES_REPOSITORY:$BASE_NODE_IMAGE_TAG

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY static /static

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 5000
CMD ["npm", "run", "start:dev"]

#FROM node:14-alpine as base
#
#WORKDIR /home/node/app
#COPY package.json ./
#COPY tsconfig.json ./
#COPY static ./
#COPY . .
#RUN npm i
#
#FROM base as production
#
#WORKDIR /home/node/app
#RUN npm run build
#RUN rm -rf node_modules
#RUN npm install --production
