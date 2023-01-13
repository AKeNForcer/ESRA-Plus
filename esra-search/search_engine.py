from flask import Flask, request
from pipelines.engine import ESRAEngine
import warnings
from dotenv import load_dotenv
import os
from pipelines.bm25 import BM25
from pipelines.cross_encoder import ThreadCrossEncoderReranker
from pipelines.gpl_tsdae import GplTsdae
warnings.filterwarnings("ignore")



load_dotenv()
DEVICE = os.environ['DEVICE']
BM25_SIZE = int(os.environ['BM25_SIZE'])
GPL_TSDAE_SIZE = int(os.environ['GPL_TSDAE_SIZE'])
ES_ARGS = dict(
    hosts=os.environ['MAIN_ELASTICSEARCH_HOST'],
    basic_auth=(
        os.environ['MAIN_ELASTICSEARCH_USER'],
        os.environ['MAIN_ELASTICSEARCH_PASS'],
    )
)


class FullCrossEncoderReranker(ThreadCrossEncoderReranker):
    def __init__(self, 
                 bm25, size_bm25, 
                 gpl_tsdae, size_gpl_tsdae, 
                 device='cuda'
                ):
        super().__init__([
            dict(retriver=bm25, size=size_bm25),
            dict(retriver=gpl_tsdae, size=size_gpl_tsdae)
        ], device)


bm25, gpl_tsdae = BM25(**ES_ARGS), GplTsdae(device=DEVICE)
cer = FullCrossEncoderReranker(bm25, BM25_SIZE, gpl_tsdae, GPL_TSDAE_SIZE, device=DEVICE)
engine = ESRAEngine(cer)
completion_engine = ESRAEngine(bm25, less=True)



app = Flask(__name__)

@app.route("/")
def hello():
    return "ESRA+ Search Engine is working."

@app.route("/search", methods=['GET'])
def search():
    query = request.args.get('query', type=str)
    limit = request.args.get('limit', default=5, type=int)
    skip = request.args.get('skip', default=0, type=int)
    return engine.search(query, size=limit, shift=skip)

@app.route("/complete", methods=['GET'])
def completion():
    query = request.args.get('query', type=str)
    limit = request.args.get('limit', default=5, type=int)
    skip = request.args.get('skip', default=0, type=int)
    return completion_engine.search(query, size=limit, shift=skip)
