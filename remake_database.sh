docker-compose -f docker-helpital/docker-compose.yaml -p helpital stop database
rm -rf ./docker-helpital/postgres/db-data/*
docker-compose -f docker-helpital/docker-compose.yaml -p helpital up -d database
