from flask import Flask, request
from pipelines.engine import ESRAEngine
import warnings
from dotenv import load_dotenv
import os
from pipelines.bm25 import BM25
from pipelines.cross_encoder import ThreadCrossEncoderReranker
from pipelines.gpl_tsdae import GplTsdae
from gevent.pywsgi import WSGIServer

warnings.filterwarnings("ignore")



load_dotenv()
DEVICE = os.environ['DEVICE'] if 'DEVICE' in os.environ else 'cuda'
BM25_SIZE = int(os.environ['BM25_SIZE'])
GPL_TSDAE_SIZE = int(os.environ['GPL_TSDAE_SIZE'])
USE_GPL_TSDAE_COMPLETION = os.environ['USE_GPL_TSDAE_COMPLETION'] == "yes"

ES_ARGS = dict(
    hosts=[os.environ['MAIN_ELASTICSEARCH_HOST']],
    basic_auth=(
        os.environ['MAIN_ELASTICSEARCH_USER'],
        os.environ['MAIN_ELASTICSEARCH_PASS'],
    )
)


HOST = os.environ['HOST'] if 'HOST' in os.environ else ''
PORT = int(os.environ['PORT']) if 'PORT' in os.environ else 5000

class FullCrossEncoderReranker(ThreadCrossEncoderReranker):
    def __init__(self, 
                 bm25, size_bm25, 
                 gpl_tsdae, size_gpl_tsdae, 
                 hosts, basic_auth,
                 device='cuda'
                ):
        super().__init__([
            dict(retriver=bm25, size=size_bm25),
            dict(retriver=gpl_tsdae, size=size_gpl_tsdae)
        ], hosts, basic_auth, device)


bm25, gpl_tsdae = BM25(**ES_ARGS), GplTsdae(device=DEVICE)
cer = FullCrossEncoderReranker(bm25, BM25_SIZE, gpl_tsdae, GPL_TSDAE_SIZE, **ES_ARGS, device=DEVICE)
engine = ESRAEngine(cer, **ES_ARGS)
completion_engine = ESRAEngine(gpl_tsdae if USE_GPL_TSDAE_COMPLETION else bm25, less=True, **ES_ARGS)



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




if __name__ == '__main__':
    print(f"production server is running at {HOST}:{PORT}")
    http_server = WSGIServer((HOST, PORT), app)
    http_server.serve_forever()