# ESRA-Plus

Understanding the connections between their queries and the search results presented is crucial in the scientific domain. Our previous system, ESRA, aimed to create these connections by outlining query-related topics and explaining the connections between queries and abstracts. However, it relied on only a keyword search and a computationally expensive knowledge graph. In this paper, we present ESRA+, an enhanced version of ESRA that improves the existing features and new features complementing our existing features using Question Answering and Semantic Search approaches. The system’s existing features now include the ability to perform semantic search, provide an explanation with the contribution of the specific paper of interest, and present a fact list of enti- ties related directly to the user query. The new features allow the system to recommend papers and queries and provide an overview of the query-related topic. The system has been fully redesigned and implemented. Human evaluations have shown that ESRA+ outperforms other baselines and achieves high satisfaction. The ESRA+ web application is publicly available at http://esra.cp.eng.chula.ac.th.

## Running ESRA+
To deploy and run ESRA+ System locally, we recommend you use Docker to deploy the system by follow the steps below.

1. Download "gpl-model.zip" and "explain-model.zip".

2. Unzip "gpl-model.zip" to "./esra-search/pipelines/gpl/".

3. Unzip "explain-model.zip" to "./esra-explain-worker/models/".

4. Config "docker-compose.yml" to have the number of explain-worker you want.

This is the example of and 2 explain-worker. Each worker is running at each GPU.

docker-compose.yml
```yml
  explain-worker-0:
    image: esra-explain-worker
    restart: always
    volumes:
      - ./esra-explain-worker/models/:/esra/models/
    environment:
      DEVICE: 'cuda:0'
      MAIN_ELASTICSEARCH_HOST: tcp://172.18.0.6:9200
      MAIN_ELASTICSEARCH_USER: elastic
      MAIN_ELASTICSEARCH_PASS: esra_CP44
      BACKEND_URL: http://backend:3001/
      MONGODB_URI: mongodb://esra:esra@mongo_mongo_1:27017/?authMechanism=DEFAULT
      EXPIRE_DURATION: 300000
      PORT: 5559
    networks:
      - esra
    deploy:
      resources:
        reservations:
          devices:
          -  driver: nvidia
             count: all
             capabilities: [gpu]
  explain-worker-1:
    image: esra-explain-worker
    restart: always
    volumes:
      - ./esra-explain-worker/models/:/esra/models/
    environment:
      DEVICE: 'cuda:1'
      MAIN_ELASTICSEARCH_HOST: tcp://172.18.0.6:9200
      MAIN_ELASTICSEARCH_USER: elastic
      MAIN_ELASTICSEARCH_PASS: esra_CP44
      BACKEND_URL: http://backend:3001/
      MONGODB_URI: mongodb://esra:esra@mongo_mongo_1:27017/?authMechanism=DEFAULT
      EXPIRE_DURATION: 300000
      PORT: 5559
    networks:
      - esra
    deploy:
      resources:
        reservations:
          devices:
          -  driver: nvidia
             count: all
             capabilities: [gpu]
  explain-controller:
    image: esra-explain-controller
    restart: always
    environment:
      WORKERS_URL: '"http://explain-worker-0:5559/","http://explain-worker-1:5559/"'
      WORK_LIMIT: 2
      PORT: 5559
    networks:
      - esra
    links:
      - explain-worker-0
      - explain-worker-1
```

5. Config "docker-compose.yml" and "load-balancer/nginx.conf" to have the number of search-worker you want.

This is the example of and 2 explain-worker. Each worker is running at each GPU.

docker-compose.yml
```yml
  search-0:
    image: esra-search
    restart: always
    environment:
      MAIN_ELASTICSEARCH_HOST: tcp://172.18.0.6:9200
      MAIN_ELASTICSEARCH_USER: elastic
      MAIN_ELASTICSEARCH_PASS: esra_CP44
      DEVICE: 'cuda:0'
      BM25_SIZE: 100
      GPL_TSDAE_SIZE: 100
      USE_GPL_TSDAE_COMPLETION: 'no'
    volumes:
      - ./esra-search/pipelines/gpl/:/esra/pipelines/gpl/
    networks:
      - esra
      - esra-db-es
    deploy:
      resources:
        reservations:
          devices:
          -  driver: nvidia
             count: all
             capabilities: [gpu]
  search-1:
    image: esra-search
    restart: always
    environment:
      MAIN_ELASTICSEARCH_HOST: tcp://172.18.0.6:9200
      MAIN_ELASTICSEARCH_USER: elastic
      MAIN_ELASTICSEARCH_PASS: esra_CP44
      DEVICE: 'cuda:1'
      BM25_SIZE: 100
      GPL_TSDAE_SIZE: 100
      USE_GPL_TSDAE_COMPLETION: 'no'
    volumes:
      - ./esra-search/pipelines/gpl/:/esra/pipelines/gpl/
    networks:
      - esra
      - esra-db-es
    deploy:
      resources:
        reservations:
          devices:
          -  driver: nvidia
             count: all
             capabilities: [gpu]
  search-load-balancer:
    image: esra-search-load-balancer
    links:
      - search-0
      - search-1
    restart: always
    networks:
      - esra
```

load-balancer/nginx.conf
```conf
upstream search {
    server search-1:5000;
    server search-0:5000;
}
server {
    listen 80;
    location / {
        proxy_pass http://search/;
    }
}
```

6. Build and depoly system by run following command and wait for a while.

```sh
sh cd.sh
```

7. Now you can access the ESRA+ Web Application via http://localhost:6680/


