from elasticsearch import Elasticsearch
import pickle

class BM25:
    def __init__(
        self, 
        hosts=["tcp://172.18.0.2:9200"],
        basic_auth = ("elastic", "esra_CP44")
    ):
        self.es = Elasticsearch(hosts, basic_auth=basic_auth,)

    def eval(self, query, size=5):
        res = self.es.search(
            index="papers", 
            query={
                "bool": {
                    "must": [
                        {
                            "regexp": {
                            "categories": {
                                "value": "(.* cs|cs)(\.).+",
                            }
                            }
                        }
                    ],
                    "should": [
                        {
                        "match": {
                            "abstract": {
                            "query": query
                            }
                        }
                        },
                        {
                        "match": {
                            "abstract": {
                            "query": query,
                            "operator": "and",
                            "boost": 1000
                            }
                        }
                        },
                        {
                        "match_phrase": {
                            "abstract": {
                            "query": query,
                            "boost": 1000000
                            }
                        }
                        },
                    ]
                },
            },
            fields=[
                "id"
            ], _source=False, size=size
        )
        return [ (x['fields']['id'][0], x["_score"]) for x in res.body["hits"]["hits"] ]
