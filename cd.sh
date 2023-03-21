docker build -t esra-backend ./esra-backend  && \
docker build -t esra-frontend ./esra-frontend  && \
docker build -t esra-paper ./esra-paper  && \
docker build -t esra-search ./esra-search  && \
docker build -t esra-search-load-balancer ./load-balancer  && \
docker build -t esra-explain-controller ./esra-explain-controller  && \
docker build -t esra-explain-worker ./esra-explain-worker  && \
docker build -t esra-nginx ./api-gateway  && \
docker build -t reverse-proxy-gateway ./reverse-proxy-gateway && \
docker-compose up -d