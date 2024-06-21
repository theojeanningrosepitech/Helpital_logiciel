FROM node:18.2.0
ENV NODE_ENV=production
ENV TZ=Europe/Paris

WORKDIR /

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

#COPY ./.env .
#COPY ./app.js .
#COPY ./server .
#COPY ./server .
#COPY ./views .
#COPY ./routes .
#COPY ./public .
#COPY ./documentation .

COPY . .

EXPOSE 3000

CMD [ "node", "server/server" ]
