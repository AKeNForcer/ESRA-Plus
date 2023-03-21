from bson import CodecOptions
from elasticsearch import Elasticsearch
from flask import Flask, request
from dotenv import load_dotenv
import os
from gevent.pywsgi import WSGIServer
from datetime import datetime, timedelta
from utils.explain import ExplainService
import os
import torch
import requests

load_dotenv()
DEVICE = os.environ['DEVICE'] if 'DEVICE' in os.environ else 'cuda'
if 'cuda' in DEVICE:
    os.environ["CUDA_VISIBLE_DEVICES"] = '0' if DEVICE == 'cuda' else DEVICE.strip('cuda:')
    print(torch.cuda.device_count(), torch.cuda.get_device_name(0))
    DEVICE = 'cuda'

import pymongo
import pytz

EXPIRE_DURATION = timedelta(milliseconds=int(os.environ['EXPIRE_DURATION']))
ES_ARGS = dict(
    hosts=os.environ['MAIN_ELASTICSEARCH_HOST'],
    basic_auth=(
        os.environ['MAIN_ELASTICSEARCH_USER'],
        os.environ['MAIN_ELASTICSEARCH_PASS'],
    )
)

BACKEND_URL = os.environ['BACKEND_URL']

HOST = os.environ['HOST'] if 'HOST' in os.environ else ''
PORT = int(os.environ['PORT']) if 'PORT' in os.environ else 5000

main_es = Elasticsearch(**ES_ARGS)

mongo_client = pymongo.MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client[f"esra_plus"].with_options(codec_options=CodecOptions(tz_aware=True,tzinfo=pytz.utc))
explain_col = db["explanations"]
overview_col = db["overviews"]
question_col = db["questions"]

if DEVICE == 'cuda':
    exps = ExplainService(db)
else:
    exps = ExplainService(db, DEVICE)

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
    
    try:
        paper = main_es.search(
            index="papers", 
            query= {
                "match_phrase": { "id": paper_id }
            },
            _source=True, 
            size=1
        )["hits"]["hits"][0]['_source']
    except IndexError:
        return "not found"

    explain_paragraph = exps.explain2(
        query,
        paper['abstract'] #f"( id: {paper['id']} | authors: {paper['authors']} | title: {paper['title']}) {paper['abstract']}"
    )
    # explanation = exps.highlight(query, explain_paragraph)
    explanation = [dict(order=i+1, sentence=sen, value=0) for i, sen in enumerate(explain_paragraph)]

    # exps.explain()
    explain_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "paperId": paper_id,
        "explanation": explanation
    })
    return "success"

# @app.route("/overview", methods=['POST'])
# def gen_overview():
#     query = request.json["query"]
#     result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=5)).json()['result']
#     overview_list = exps.overview(query, [r['abstract'] for r in result], similarity_threshold=2, num_return_sequences=1, verbose=False)
#     overview_col.insert_one({
#         "created_date": datetime.utcnow(),
#         "expire_date": datetime.utcnow() + EXPIRE_DURATION,
#         "query": query,
#         "overview": ' '.join(overview_list)
#     })
#     return "success"

@app.route("/overview", methods=['POST'])
def gen_overview():
    query = request.json["query"]
    result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=5)).json()['result']
    # overview_list = exps.overview_ner(query, result, verbose=False)
    overview_list = exps.overview(query, [r['abstract'] for r in result], verbose=False)
    overview_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "overview": [dict(question=o[0], overview=o[1]) for o in overview_list]
    })
    return "success"

@app.route("/question", methods=['POST'])
def gen_question():
    query = request.json["query"]
    result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=5)).json()['result']
    questions = exps.gen_question(query, [r['abstract'] for r in result], num_return_sequences=2, similarity_threshold=2, min_pass=5)
    question_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "questions": questions
    })
    return "success"

if __name__ == '__main__':
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()