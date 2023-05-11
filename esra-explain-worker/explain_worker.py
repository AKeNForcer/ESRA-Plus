from bson import CodecOptions
from elasticsearch import Elasticsearch
from flask import Flask, request
from dotenv import load_dotenv
import os
from gevent.pywsgi import WSGIServer
from datetime import datetime, timedelta
from utils.explain import ExplainService
import torch
import requests


import urllib.request
from time import sleep
import pdfplumber
from nltk.tokenize import word_tokenize, sent_tokenize

from datetime import datetime
from utils.gpl_tsdae import GplTsdae
import numpy as np

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, StoppingCriteria, StoppingCriteriaList


load_dotenv()
DEVICE = os.environ['DEVICE'] if 'DEVICE' in os.environ else 'cuda'
if 'cuda' in DEVICE:
    os.environ["CUDA_VISIBLE_DEVICES"] = '0' if DEVICE == 'cuda' else DEVICE.strip('cuda:')
    print(torch.cuda.device_count(), torch.cuda.get_device_name(0))
    DEVICE = 'cuda'

import pymongo
import pytz

EXPIRE_DURATION = timedelta(milliseconds=int(os.environ['EXPIRE_DURATION']))

wc = 100

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
chat_col = db["chats"]
factlist_col = db["flists"]

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

def get_paper_full(paper_id):
    es_res = main_es.search(
        index="papers", 
        query= {
            "match_phrase": { "id": paper_id }
        },
        _source=True, 
        size=1
    )["hits"]["hits"][0]['_source']
    return es_res

def download_paper_and_save_as_txt(paper_id):
    paper_id_file_name = paper_id.replace("/", "-*")
    if os.path.exists(f"papers_txt/{paper_id_file_name}.txt"):
        return
    for try_count in range(6):
        try:
            print(f"https://export.arxiv.org/pdf/{paper_id}.pdf")
            urllib.request.urlretrieve(f"https://export.arxiv.org/pdf/{paper_id}.pdf", f"./temp/{paper_id_file_name}.pdf")
            break
        except Exception as e:
            if try_count >= 5:
                raise e
            print(f"{try_count}-retry, get {paper_id} in 10 seconds.")
            sleep(10)
    pdfp = pdfplumber.open(f"./temp/{paper_id_file_name}.pdf")
    full_text = '\n'.join([page.extract_text() for page in pdfp.pages])
    tok = sent_tokenize(full_text)
    new_tok = []
    for s in tok:
        score = sum([ c not in "+-*/=^(){}[]0123456789!@ " and ord(c) < 128 for c in s ]) / (len(s))
        if score >= 0.8:
            new_tok.append(s)
    with open(f"papers_txt/{paper_id_file_name}.txt", "w") as f:
        f.write(' '.join(new_tok))
    os.remove(f"./temp/{paper_id_file_name}.pdf")

gpl = GplTsdae()

paper_txt_corpus_temp = {}

def embed_paper_txt(paper_id):
    paper_id_file_name = paper_id.replace("/", "-*")
    if paper_id in paper_txt_corpus_temp:
        return
    with open(f"papers_txt/{paper_id_file_name}.txt", "r") as f:
        paper_txt = f.read()
    paper_ln = word_tokenize(paper_txt)
    paper_ln = [' '.join(paper_ln[i:i+wc]) for i in range(0, len(paper_ln), wc)]
    corpus = gpl.sbert.encode_corpus([ {'title': '', 'text': t} for t in paper_ln ])
    paper_txt_corpus_temp[paper_id] = (paper_ln, corpus)

def get_paper_txt_text_input(paper_id, query, limit=4):
    paper_ln, corpus = paper_txt_corpus_temp[paper_id]
    scores = np.sum(np.repeat(gpl.sbert.encode_queries([query]), corpus.shape[0], axis=0) * corpus, axis=1)
    raw_input = sorted(sorted(list(zip(scores, enumerate(paper_ln))), key=lambda x: -x[0])[:limit], key=lambda x: x[1][0])
    real_input = [ t[1][1] for t in raw_input]
    return real_input


print("+++ model ready +++")


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

    explain_paragraph = [exps.explain(query, paper['abstract'])]
    explanation = [dict(order=i+1, sentence=sen, value=0) for i, sen in enumerate(explain_paragraph)]

    explain_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "paperId": paper_id,
        "explanation": explanation
    })
    return "success"

@app.route("/factlist", methods=['POST'])
def gen_factlist():
    query = request.json["query"]
    result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=3)).json()['result']
    fact_list_res = exps.factlist(query, [r['abstract'] for r in result])
    factlist_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "fact_list": fact_list_res,
        # "documents": [r['abstract'] for r in result]
    })
    return "success"

@app.route("/overview", methods=['POST'])
def gen_overview():
    query = request.json["query"]
    result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=3)).json()['result']
    overview_res = exps.overview(query, [r['abstract'] for r in result])
    overview_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "overview": [dict(question=query, overview=overview_res)],
        # "documents": [r['abstract'] for r in result]
    })
    return "success"

@app.route("/question", methods=['POST'])
def gen_question():
    query = request.json["query"]
    result = requests.get(os.path.join(BACKEND_URL, "search"), dict(query=query, limit=3)).json()['result']
    questions = exps.gen_question(query, [r['abstract'] for r in result], num_return_sequences=2, similarity_threshold=2, min_pass=5)
    question_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "questions": questions
    })
    return "success"


@app.route("/chat", methods=['POST'])
def chat_with_paper():
    paper_id = request.json["paperId"]
    query = request.json["query"]
    download_paper_and_save_as_txt(paper_id)
    embed_paper_txt(paper_id)
    text_input = get_paper_txt_text_input(paper_id, query, limit=2)
    paper_metadata = get_paper_full(paper_id)
    ans, conv = exps.chat(query, paper_metadata, text_input)
    chat_col.insert_one({
        "created_date": datetime.utcnow(),
        "expire_date": datetime.utcnow() + EXPIRE_DURATION,
        "query": query,
        "paperId": paper_id,
        "answer": ans,
        "text_input": text_input,
    })
    return "success"

if __name__ == '__main__':
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()