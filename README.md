# ESRA-Plus

Understanding the connections between their queries and the search results presented is crucial in the scientific domain. Our previous system, ESRA, aimed to create these connections by outlining query-related topics and explaining the connections between queries and abstracts. However, it relied on only a keyword search and a computationally expensive knowledge graph. In this paper, we present ESRA+, an enhanced version of ESRA that improves the existing features and new features complementing our existing features using Question Answering and Semantic Search approaches. The system’s existing features now include the ability to perform semantic search, provide an explanation with the contribution of the specific paper of interest, and present a fact list of enti- ties related directly to the user query. The new features allow the system to recommend papers and queries and provide an overview of the query-related topic. The system has been fully redesigned and implemented. Human evaluations have shown that ESRA+ outperforms other baselines and achieves high satisfaction. The ESRA+ web application is publicly available at http://esra.cp.eng.chula.ac.th.

## Running ESRA+
To deploy and run ESRA+ System locally, we recommend you use Docker to deploy the system by follow the steps below.

### Deploy Databases
Follow the steps below to deploy databases.

1. Download every .zip files from <a href="https://chula-my.sharepoint.com/:f:/g/personal/6230334021_student_chula_ac_th/ErisPLQAufJLs2UFVpizUBIBeO6sMu_dZWn_XN8spVMjpw?e=fFOP9q">here</a>.

2. Create directory for elasticsearch. Then, go to the the elasticsearch directory and create this "docker-compose.yml" file
```yml
version: "3.9"
networks:
  esra-db-es:
    external: true
services:
  elasticsearch:
    image: elasticsearch:8.4.3
    restart: always
    volumes:
    - ./es-data:/usr/share/elasticsearch/data
    environment:
      ELASTICSEARCH_USERNAME: esra
      ELASTIC_PASSWORD: esra_CP44
      discovery.type: single-node
      xpack.security.enabled: "true"
    ports:
    - '9200:9200'
    - '9300:9300'
    networks:
    - esra-db-es
  mongo:
    image: mongo:4.4.15
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: esra
      MONGO_INITDB_ROOT_PASSWORD: esra
    ports:
      - '27017:27017'
    volumes:
      - ./mongo-data:/data/db
    networks:
      - esra-db-es
```

3. Unzip "es-data.zip" and rename the "data" directory to "es-data"

4. Unzip "mongo-data.zip" and rename the "data" directory to "mongo-data"

5. If using Linux or MacOS, ensure that the container can access "es-data" and "mongo-data" directory by execute this command
```bash
chmod -R 777 es-data && chmod -R 777 mongo-data
```

6. If network "esra-db-es" is not created execute this command
```bash
docker network create esra-db-es
```

7. Start containers by execute this command
```bash
docker compose up -d
```
To check that the "elasticsearch" and "mongo" containers is up and running by execute this command
```bash
docker compose ps
```
you should see something like this
```
NAME                      IMAGE                 COMMAND                  SERVICE             CREATED             STATUS              PORTS
test-es_elasticsearch_1   elasticsearch:8.4.3   "/bin/tini -- /usr/l…"   elasticsearch       11 seconds ago      Up 10 seconds       0.0.0.0:9200->9200/tcp, :::9200->9200/tcp, 0.0.0.0:9300->9300/tcp, :::9355->9300/tcp
test-es_mongo_1           mongo:4.4.15          "docker-entrypoint.s…"   mongo               11 seconds ago      Up 10 seconds       0.0.0.0:27017->27017/tcp, :::27017->27017/tcp
```

### Deploy Web Application
After deploy databases finish. Follow the steps below to deploy the web-application.

1. Download every .zip files from <a href="https://chula-my.sharepoint.com/:f:/g/personal/6230334021_student_chula_ac_th/ErisPLQAufJLs2UFVpizUBIBeO6sMu_dZWn_XN8spVMjpw?e=fFOP9q">here</a>.

2. Clone this GitHub repository
```bash
git clone https://github.com/AKeNForcer/ESRA-Plus.git
```

3. Unzip "gpl-model.zip" to "./esra-search/pipelines/gpl/".

4. Unzip "explain-model.zip" to "./esra-explain-worker/models/".

5. Config "docker-compose.yml" to have the number of explain-worker you want.

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

6. Config "docker-compose.yml" and "load-balancer/nginx.conf" to have the number of search-worker you want.

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

7. Build and depoly system by run following command and wait for a while.

```sh
sh cd.sh
```

8. Now you can access the ESRA+ Web Application at http://localhost:6680/


