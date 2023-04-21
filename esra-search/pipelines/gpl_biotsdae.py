from sentence_transformers import SentenceTransformer

from .gpl.gpl.toolkit.sbert import load_sbert
from beir.retrieval.search.dense import FlatIPFaissSearch as FFS

from beir.retrieval.evaluation import EvaluateRetrieval
from beir.retrieval.search.dense import DenseRetrievalExactSearch as DRES
from beir.retrieval import models
import json

class GplBioTsdae:
    def __init__(
        self,
        index_name="gpl-biotsdae-embedded", 
        model_name_or_path="./pipelines/gpl/BIO_TSDAE/190000",
        embedding_path='./pipelines/gpl/embedding/BIO_TSDAE',
        corpus_path='./pipelines/gpl/biorxiv/corpus.jsonl',
        device='cuda'
    ):
        self.index_name = index_name
        #Faiss Indexing
        model: SentenceTransformer = load_sbert(model_name_or_path, None, 350, device=device)
        sbert = models.SentenceBERT(sep=' ')
        sbert.q_model = model
        sbert.doc_model = model
        self.model_ffs = FFS(sbert)
        self.model_ffs.load(f'{embedding_path}')
        self.corpus = dict()
        with open(f'{corpus_path}', 'r') as json_file:
            json_list = list(json_file)
        for json_str in json_list:
            result = json.loads(json_str)
            temp = dict()
            temp['title'], temp['text'] = result['title'], result['text']
            self.corpus[result['_id']] = temp
            
        #Dense Retriever
        model = DRES(sbert)
        self.dres = model
        self.retriever = EvaluateRetrieval(model, score_function="dot") # or "cos_sim" for cosine similarity
        
    def eval(self, query, size):
        real_query = dict()
        real_query['0'] = query
        results = self.model_ffs.search(self.corpus, real_query, size * 3, 'dot')
        eval_result = list()
        for key, value in results['0'].items() :
            temp = (key, value)
            eval_result.append(temp)
        s = set()
        unique_paper = 0
        new_eval_result = list()
        for item in eval_result :
            paper_id = item[0].split(':')[0]
            if paper_id not in s :
                s.add(paper_id)
                unique_paper += 1
                temp = (paper_id,item[1])
                new_eval_result.append(temp)
            if unique_paper == size :
                break
        return new_eval_result
    
    def get_similarity_score(self, corpus, query, top_k, score_function):
        real_query = dict()
        real_query['0_query'] = query
        real_corpus = dict()
        temp = dict()
        temp['title'], temp['text'] = '', corpus
        real_corpus['0_corpus'] = temp
        return self.dres.search(real_corpus, real_query, top_k, score_function)['0_query']['0_corpus']

