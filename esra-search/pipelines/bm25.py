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
                        {
                            "match": {
                                "title": {
                                    "query": query,
                                    "boost": 5
                                }
                            }
                        },
                        {
                            "match": {
                                "title": {
                                    "query": query,
                                    "operator": "and",
                                    "boost": 5000
                                }
                            }
                        },
                        {
                            "match_phrase": {
                                "title": {
                                    "query": query,
                                    "boost": 5000000
                                }
                            }
                        },
                        {
                            "match": {
                                "authors": {
                                    "query": query,
                                    "boost": 10
                                }
                            }
                        },
                        {
                            "match": {
                                "authors": {
                                    "query": query,
                                    "operator": "and",
                                    "boost": 10000
                                }
                            }
                        },
                        {
                            "match_phrase": {
                                "authors": {
                                    "query": query,
                                    "boost": 10000000
                                }
                            }
                        },
                        {
                            "match_phrase": {
                                "id": {
                                    "query": query,
                                    "boost": 50000000
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
