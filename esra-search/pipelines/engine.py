import pandas as pd
import pymongo
from elasticsearch import Elasticsearch

class ESRAEngine:

    def __init__(self, pipeline, explainer=None, es_url=["tcp://172.18.0.2:9200"], es_auth=("elastic", "esra_CP44")):
        self.pipeline = pipeline
        self.explainer = explainer
        self.main_es = Elasticsearch(es_url, basic_auth=es_auth)

    def search(self, query, size=10, shift = 0):
        eval_result = self.pipeline.eval(query, size + shift)[shift:]
        papers_id = [x[0] for x in eval_result]
        score_by_papers_id = {x[0]: x[1:] for x in eval_result}

        es_res = self.main_es.search(
            index="papers", 
            query={
                "bool": {
                    "should": [
                        { "match_phrase": { "id": x } }
                        for x in papers_id
                    ]
                }
            },
            _source=False, 
            fields=["id", "categories", "title", "abstract", "authors"],
            size=size
        )["hits"]["hits"]

        return [dict(rank=i+1, **x) for i, x in enumerate(sorted([ {
            'score': score_by_papers_id[x['fields']['id'][0]][0],
            'categories': x['fields']['categories'][0],
            'paperId': x['fields']['id'][0],
            'title': x['fields']['title'][0],
            'abstract': x['fields']['abstract'][0],
            'authors': x['fields']['authors'][0],
            'detail': score_by_papers_id[x['fields']['id'][0]][1],
        } for i, x in enumerate(es_res)], key=lambda x: -x['score']))]
