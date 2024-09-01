# Helpital

Helpital est un logiciel d'optimisation et d'organisation destiné aux hôpitaux. Nous essayons de résoudre les problèmes de communication dans les hôpitaux en proposant un logiciel simple d'utilisation et qui leur correspond. Le but est donc de réunir toutes les fonctionnalitées des logiciels existant en un seul.


### Team

- Emmanuel Lena
- Charles Debrix
- Cesar Venzac
- Paul Riba
- Irama Chaouch
- Arnaud Lubert
- Théo Jeanningros
- Bryan Fortin


### Project dependencies

- Node.js
- postgres OR Docker


### In this section you can write useful commands

Start the project:\
`cd electron-app`\
`npm install`\
`cp sample.env .env`\
`npm run server`\
`npm start` (from another cli)\

Start postgres docker container:\
`cd docker-helpital`\
`docker-compose -f docker-compose.yaml  -p helpital up`

Access postgres via cli:\
`psql -d electron_app -U postgres -h 127.0.0.1 -p 5432 -W`\
`psql -d helpital_test -U postgres -h 127.0.0.1 -p 5000 -W`\
`docker exec -it docker_postgres_1 psql -U postgres`

pqsl commands:\
`\dt` list tables\
`\d [table]` list columns

Dump postgres database:\
`pg_dump -d electron_app -U postgres -h 127.0.0.1 -p 5432 -W > output.sql`

Restore postgres database:\
`psql -d electron_app -U postgres -h 127.0.0.1 -p 5432 -W < input.sql`

Update postgres database (using Docker):\
`docker-compose -f compose.yaml -p helpital down`\
`rm -rf docker/postgres/data/*`\
`docker-compose -f compose.yaml -p helpital up`

Run unit tests:\
`npm test`\
or\
`./node_modules/mocha/bin/mocha (--exit)`

Run coding style tests:\
`npm run codestyle (file)`\

Run server:\
`npm run server`\

Run software:\
`npm start`\
