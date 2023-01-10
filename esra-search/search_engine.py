from flask import Flask, request
from pipelines.engine import ESRAEngine
import warnings
from dotenv import load_dotenv
import os
from pipelines.bm25 import BM25
from pipelines.cross_encoder import ThreadCrossEncoderReranker
from pipelines.gpl_tsdae import GPL_TSDAE
warnings.filterwarnings("ignore")



load_dotenv()
DEVICE = os.environ['DEVICE']
BM25_SIZE = int(os.environ['BM25_SIZE'])
GPL_TSDAE_SIZE = int(os.environ['GPL_TSDAE_SIZE'])



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


bm25, gpl_tsdae = BM25(), GPL_TSDAE(device=DEVICE)
cer = FullCrossEncoderReranker(bm25, BM25_SIZE, gpl_tsdae, GPL_TSDAE_SIZE, device=DEVICE)
engine = ESRAEngine(cer)



app = Flask(__name__)

@app.route("/")
def hello():
    return "ESRA+ Search Engine is working."

@app.route("/search", methods=['GET'])
def search():
    query = request.args['query']
    if 'limit' in request.args:
        limit = int(request.args['limit'])
    else:
        limit = 5
    if 'skip' in request.args:
        skip = int(request.args['skip'])
    else:
        skip = 0
    return engine.search(query, size=limit, shift=skip)