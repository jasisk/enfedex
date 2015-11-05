FROM mhart/alpine-node:5

MAINTAINER Jean-Charles Sisk <jeancharles@paypal.com>

RUN apk add --update make gcc g++ python && \
  rm -rf /var/cache/apk/*

WORKDIR /src
COPY . .

RUN npm install --unsafe-perm && \
  rm -rf /root/.npm /root/.node-gyp

RUN apk del make gcc g++ python && \
  rm -rf /tmp/* 

CMD ["npm", "start"]
