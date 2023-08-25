###################
# Server
###################

FROM node:18-alpine
LABEL authors="500 Historias"

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Backend app package and package-lock.json file
COPY ./package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Bundle app source
COPY . .

EXPOSE 3000

# Start the server
CMD [ "node", "./index.js" ]