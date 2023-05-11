import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM, T5Tokenizer, T5ForConditionalGeneration, MT5ForConditionalGeneration, AutoModelForCausalLM
from sentence_transformers import CrossEncoder
from nltk.tokenize import sent_tokenize
import nltk.data
import numpy as np
import re
from datetime import datetime
from utils.llm import LlmPipeline

pattern = r'[0-9]'

class ExplainService:
    def __init__(self, db, t5_arxiv_path='./models/mt5-small-finetuned-arxiv-cs', device='cuda'):
        self.device = device
        
        self.tokenizer_T5 = T5Tokenizer.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')
        self.model_T5 = T5ForConditionalGeneration.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')

        self.model_CE = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512, device=device)
        self.tokenizer_sentence = nltk.data.load('tokenizers/punkt/english.pickle')

        self.llm = LlmPipeline(self.device)
    
    def _gen_questions(self, documents, num_return_sequences=5):
        t5_encoded_inputs = self.tokenizer_T5.batch_encode_plus(
            documents, return_tensors='pt', padding=True)
        generated_question_sequences = self.model_T5.generate(
            input_ids=t5_encoded_inputs['input_ids'],
            attention_mask=t5_encoded_inputs['attention_mask'],
            max_length=64,
            do_sample=True, 
            top_p=0.95,
            num_return_sequences=num_return_sequences
        )
        decoded_sequences = self.tokenizer_T5.batch_decode(
            generated_question_sequences, skip_special_tokens=True)
        return decoded_sequences
    
    def _calc_similiarity(self, query, sentences, pair_zip=False):
        if type(query) != type([]):
            query = [query]
        if pair_zip:
            sentence_combinations = list(zip(query, sentences))
        else:
            sentence_combinations = [(q, s) for q in query for s in sentences]
        similarity_scores = self.model_CE.predict(sentence_combinations)
        return list(zip(similarity_scores, sentence_combinations))
    
    def gen_question(self,
                 query, 
                 documents,
                 num_return_sequences,
                 similarity_threshold,
                 min_pass,
                 verbose=False):
        questions = self._gen_questions(documents, num_return_sequences)
        questions = list(set(questions))
        questions = sorted(self._calc_similiarity(query, questions), 
                         key=lambda x: -x[0])
        if verbose: print("questions:\n", questions)
        
        cut = 0
        for score, question in questions:
            if cut >= min_pass and score < similarity_threshold:
                break
            cut += 1
        questions = [q[1][1] for q in questions[:cut]]
        if verbose: print("cut at:", cut)
        return questions

    def explain(self, query, abstract, join=False, verbose=False):
        prompt = f"Give me the relationship between the query and the abstract\nQuery: {query}\nContext: {abstract}"
        ans, _ = self.llm.infer(prompt, max_new_tokens=256)
        return ans

    def overview(self, query, documents):
        context = " ".join(documents).replace("\n", " ")
        prompt = f'Give me the overview of "{query}" from given context in one paragraph.\nContext: {context}'
        ans, _ = self.llm.infer(prompt, max_new_tokens=256)
        return ans

    def factlist(self, query, documents):
        context = " ".join(documents).replace("\n", " ")
        prompt = f'Give 5 most important facts from the context relating to this query from 1 to 5 in a form of a list\nQuery: {query}\n Context: {context}'
        ans, _ = self.llm.infer(prompt, max_new_tokens=256)
        return ans

    def chat(self, query, paper_metadata, text_input, conv=None):
        prompt = f"{query}\nThis is paper metadata.\n{paper_metadata}\nThis is text in the paper.\n{' '.join([f'{i}) {t}' for i, t in enumerate(text_input)])}"
        return self.llm.infer(prompt, conv, max_new_tokens=512)