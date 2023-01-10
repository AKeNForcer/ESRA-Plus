from elasticsearch import Elasticsearch
from sentence_transformers import CrossEncoder
import numpy as np
from concurrent.futures import ThreadPoolExecutor

class CrossEncoderReranker:
    def __init__(
        self, 
        retrivers,
    ):
        self.retrivers = retrivers
        self.main_es = Elasticsearch(["tcp://172.18.0.2:9200"], basic_auth=("elastic", "esra_CP44"),)
        self.model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    def search_paper(self, retrived_papers):
        return self.main_es.search(
            index="papers", 
            query={
                "bool": {
                    "should": [
                        { "match_phrase": { "id": x[0] } }
                        for x in retrived_papers
                    ]
                }
            },
            _source=False, 
            fields=["id", "title", "abstract"]
        )["hits"]["hits"]

    def cross_encoder_rerank(self, query, retrived_papers, size, from_pipeline):
        corpus = [x['abstract'][0] for x in retrived_papers]
        sentence_combinations = [[query, corpus_sentence] for corpus_sentence in corpus]
        similarity_scores = self.model.predict(sentence_combinations)
        sim_scores_argsort = reversed(np.argsort(similarity_scores))
        
        result = []
        for idx in sim_scores_argsort:
            result.append((
                retrived_papers[idx]['id'][0], 
                float(similarity_scores[idx]), 
                {"from": from_pipeline[retrived_papers[idx]['id'][0]]}
            ))
            if len(result) >= size:
                break
        return result

    def eval(self, query, size=5):
        retrived_papers = []
        from_pipeline = {}
        for retriver in self.retrivers:
            rp = retriver["retriver"].eval(query, retriver["size"])
            retrived_papers.extend(rp)
            for rank, p in enumerate(rp):
                if p[0] not in from_pipeline:
                    from_pipeline[p[0]] = []
                from_pipeline[p[0]].append({
                    "pipeline": type(retriver["retriver"]).__name__,
                    "rank": rank+1,
                    "score": p[1],
                })

        es_res = self.search_paper(retrived_papers)
        # print(self.retrivers)
        # print(retrived_papers)
        # print([x['fields'] for x in es_res])
        return self.cross_encoder_rerank(query, [x['fields'] for x in es_res], size, from_pipeline)
        


class ThreadCrossEncoderReranker(CrossEncoderReranker):
    def __init__(self, retrivers):
        super().__init__(retrivers)

    def _retrive(self, query, retriver):
        return retriver["retriver"].eval(query, retriver["size"])

    def eval(self, query, size=5):
        retrived_papers = []
        from_pipeline = {}
        with ThreadPoolExecutor(max_workers=len(self.retrivers)) as executor:
            futures = []
            for retriver in self.retrivers:
                futures.append(executor.submit(self._retrive, query, retriver))
            for retriver, future in zip(self.retrivers, futures):
                rp = future.result()
                retrived_papers.extend(rp)
                for rank, p in enumerate(rp):
                    if p[0] not in from_pipeline:
                        from_pipeline[p[0]] = []
                    from_pipeline[p[0]].append({
                        "pipeline": type(retriver["retriver"]).__name__,
                        "rank": rank+1,
                        "score": p[1],
                    })
        
        es_res = self.search_paper(retrived_papers)
        return self.cross_encoder_rerank(query, [x['fields'] for x in es_res], size, from_pipeline)