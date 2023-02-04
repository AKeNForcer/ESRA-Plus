import pandas as pd
import pymongo
from elasticsearch import Elasticsearch

class ESRAEngine:

    def __init__(self, pipeline, less=False, hosts=["tcp://172.18.0.2:9200"], basic_auth=("elastic", "esra_CP44")):
        self.pipeline = pipeline
        self.less = less
        self.main_es = Elasticsearch(hosts, basic_auth=basic_auth)
        self.fields = ["id", "title", "update_date", *([] if self.less else ["categories", "abstract", "authors"])]

    def search(self, query, size=10, shift = 0):
        eval_result = self.pipeline.eval(query, size + shift)[shift:]
        papers_id = [x[0] for x in eval_result]
        score_by_papers_id = {x[0]: (x[1], x[2] if len(x) > 2 else None) for x in eval_result}

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
            fields=self.fields,
            size=size
        )["hits"]["hits"]

        return [dict(rank=i+1, **x) for i, x in enumerate(sorted([ {
            'score': score_by_papers_id[x['fields']['id'][0]][0],
            'detail': score_by_papers_id[x['fields']['id'][0]][1],
            **{ 'paperId' if field=='id' else field: x['fields'][field][0] for field in self.fields }
            # 'categories': x['fields']['categories'][0],
            # 'paperId': x['fields']['id'][0],
            # 'title': x['fields']['title'][0],
            # 'abstract': x['fields']['abstract'][0],
            # 'authors': x['fields']['authors'][0],
        } for i, x in enumerate(es_res)], key=lambda x: -x['score']))]
