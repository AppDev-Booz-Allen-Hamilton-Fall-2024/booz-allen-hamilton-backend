FROM alpine:3.20

WORKDIR /booz-allen-hamilton-backend

COPY package.json /booz-allen-hamilton-backend/package.json

RUN apk add --update nodejs npm

RUN npm install --force

COPY . /booz-allen-hamilton-backend/

EXPOSE 3000

CMD ["npm", "start"]