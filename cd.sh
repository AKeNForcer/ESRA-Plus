docker build -t esra-backend ./esra-backend  && \
docker build -t esra-frontend ./esra-frontend  && \
docker build -t esra-paper ./esra-paper  && \
docker build -t esra-search ./esra-search  && \
docker build -t esra-nginx ./api-gateway  && \
docker-compose up -d