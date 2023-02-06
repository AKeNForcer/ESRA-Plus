from bson import CodecOptions
from elasticsearch import Elasticsearch
from flask import Flask, request
from dotenv import load_dotenv
import os
from gevent.pywsgi import WSGIServer
from datetime import datetime, timedelta

import pymongo
import pytz

load_dotenv()
EXPIRE_DURATION = timedelta(milliseconds=int(os.environ['EXPIRE_DURATION']))
ES_ARGS = dict(
    hosts=os.environ['MAIN_ELASTICSEARCH_HOST'],
    basic_auth=(
        os.environ['MAIN_ELASTICSEARCH_USER'],
        os.environ['MAIN_ELASTICSEARCH_PASS'],
    )
)
DEVICE = os.environ['DEVICE'] if 'DEVICE' in os.environ else 'cuda'

HOST = os.environ['HOST'] if 'HOST' in os.environ else ''
PORT = int(os.environ['PORT']) if 'PORT' in os.environ else 5000

main_es = Elasticsearch(**ES_ARGS)

mongo_client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client[f"esra_plus"].with_options(codec_options=CodecOptions(tz_aware=True,tzinfo=pytz.utc))
explain_col = db["explanations"]

def get_paper_abstract(paper_id):
    es_res = main_es.search(
        index="papers", 
        query= {
            "match_phrase": { "id": paper_id }
        },
        _source=True, 
        size=1
    )["hits"]["hits"][0]['_source']
    return es_res["abstract"]

app = Flask(__name__)

@app.route("/explain", methods=['POST'])
def gen_explain():
    paper_id = request.json["paperId"]
    query = request.json["query"]
    if explain_col.find_one(dict(query=query, paperId=paper_id), {'_id': 1}):
        return "existed"
    for _ in range(300000000):
        pass
    explain_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "paperId": paper_id,
        "explanation": [
            dict(order=1, value=0.7, sentence='This paper describes the design and development of low cost USB Data Acquisition System (DAS) for the measurement of physical parameters.'),
            dict(order=2, value=0.3, sentence='which allows online monitoring in graphical as well as numerical display.')
        ]
    })
    return "success"

if __name__ == '__main__':
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()