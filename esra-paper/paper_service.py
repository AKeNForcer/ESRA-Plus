from flask import Flask, request
from dotenv import load_dotenv
import os
from elasticsearch import Elasticsearch
from gevent.pywsgi import WSGIServer



load_dotenv()
ES_ARGS = dict(
    hosts=os.environ['MAIN_ELASTICSEARCH_HOST'],
    basic_auth=(
        os.environ['MAIN_ELASTICSEARCH_USER'],
        os.environ['MAIN_ELASTICSEARCH_PASS'],
    )
)
PAPER_DOWNLOAD_URL = os.environ['PAPER_DOWNLOAD_URL']


HOST = os.environ['HOST'] if 'HOST' in os.environ else ''
PORT = int(os.environ['PORT']) if 'PORT' in os.environ else 5000


main_es = Elasticsearch(**ES_ARGS)



app = Flask(__name__)

@app.route("/")
def hello():
    return "ESRA+ Paper Service is working."

@app.route("/paper/<id>", methods=['GET'])
def get_paper(id: str):
    try:
        es_res = main_es.search(
            index="papers", 
            query= {
                "match_phrase": { "id": id }
            },
            _source=True, 
            size=1
        )["hits"]["hits"][0]['_source']
    except IndexError:
        return {"message": "not found"}, 404
    del es_res['update_date']
    return dict(
        **es_res,
        pdf=PAPER_DOWNLOAD_URL.format(id)
    )

if __name__ == '__main__':
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()