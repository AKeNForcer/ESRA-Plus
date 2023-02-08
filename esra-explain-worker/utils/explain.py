import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM, T5Tokenizer, T5ForConditionalGeneration, MT5ForConditionalGeneration
from sentence_transformers import CrossEncoder
from nltk.tokenize import sent_tokenize
import nltk.data
import numpy as np
import re

pattern = r'[0-9]'

class ExplainService:
    def __init__(self, t5_arxiv_path='./models/mt5-small-finetuned-arxiv-cs', device='cuda'):
        self.device = device

        self.tokenizer_lfqa = AutoTokenizer.from_pretrained("vblagoje/bart_lfqa")
        self.model_lfqa = AutoModelForSeq2SeqLM.from_pretrained("vblagoje/bart_lfqa").to(device)
        
        self.tokenizer_T5 = T5Tokenizer.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')
        self.model_T5 = T5ForConditionalGeneration.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')

        self.T5_arxiv_tokenizer = AutoTokenizer.from_pretrained(t5_arxiv_path, local_files_only = True)
        self.T5_arxiv_model = MT5ForConditionalGeneration.from_pretrained(t5_arxiv_path, local_files_only = True).to(device)

        self.model_CE = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512, device=device)
        self.tokenizer_sentence = nltk.data.load('tokenizers/punkt/english.pickle')

    def _filter(self, output, _result_prefix, _result_suffix, end_token='<extra_id_1>'):
        # The first token is <unk> (inidex at 0) and the second token is <extra_id_0> (indexed at 32099)
        _txt = self.T5_arxiv_tokenizer.decode(output[2:], skip_special_tokens=False, clean_up_tokenization_spaces=False)
        if end_token in _txt:
            _end_token_index = _txt.index(end_token)
            return _result_prefix + _txt[:_end_token_index] + _result_suffix
        else:
            return _result_prefix + _txt + _result_suffix

    def explain(self, query, abstract, join=False):
        sentences = sent_tokenize(abstract)
        sentence_combinations = [[query, sentence] for sentence in sentences]
        similarity_scores = self.model_CE.predict(sentence_combinations)
        
        qualified_sentences = []
        for i in range(len(sentences)):
            if similarity_scores[i] > 0:
                qualified_sentences.append(sentences[i])
        
        input_ids = self.tokenizer_T5.encode(abstract, return_tensors = 'pt')
        outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.95, num_return_sequences = 5)

        questions = []
        for i in range(len(outputs)):
            questions.append([query, self.tokenizer_T5.decode(outputs[i], skip_special_tokens = True)])
        for sentence in qualified_sentences:
            input_ids = self.tokenizer_T5.encode(sentence, return_tensors = 'pt')
            outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.90, num_return_sequences = 3)
            for i in range(len(outputs)):
                questions.append([query, self.tokenizer_T5.decode(outputs[i], skip_special_tokens = True)])
        
        similarity_scores_questions = self.model_CE.predict(questions)
        best_gen_question = questions[np.argmax(similarity_scores_questions)]
        documents = [abstract]
        conditioned_doc = "<P> " + " <P> ".join([d for d in documents])
        query_and_docs = "question: {} context: {}".format(best_gen_question[1], conditioned_doc)

        model_input = self.tokenizer_lfqa(query_and_docs, truncation=True, padding=True, return_tensors="pt")
        generated_answers_encoded = self.model_lfqa.generate(
            input_ids=model_input["input_ids"].to(self.device),
            attention_mask=model_input["attention_mask"].to(self.device),
            min_length=64,
            max_length=256,
            do_sample=False, 
            early_stopping=False,
            num_beams=8,
            temperature=12,
            top_k=None,
            top_p=0.97,
            eos_token_id=self.tokenizer_lfqa.eos_token_id,
            no_repeat_ngram_size=3,
            num_return_sequences=1)
        
        ans = self.tokenizer_lfqa.batch_decode(generated_answers_encoded, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        if "I'm not sure" in ans[0] :
            preprocess_text = ans[0].strip().replace("\n","")
            t5_prepared_Text = "summarize: "+preprocess_text
            tokenized_text = self.T5_arxiv_tokenizer.encode(t5_prepared_Text, return_tensors="pt", add_special_tokens=True).to(self.device)
            summary_ids = self.T5_arxiv_model.generate(
                tokenized_text,
                num_beams=4,
                no_repeat_ngram_size=2,
                min_length=30,
                max_length=100,
                early_stopping=True)
            ans = [self.T5_arxiv_tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=True) for g in summary_ids][0]
            encoded = self.T5_arxiv_tokenizer.encode_plus(ans, add_special_tokens=True, return_tensors='pt')
            input_ids = encoded['input_ids'].to(self.device)

            # Generaing 20 sequences with maximum length set to 5
            outputs = self.T5_arxiv_model.generate(
                input_ids=input_ids, 
                num_beams=30,
                num_return_sequences=10,
                max_length=30)
            
            try:
                _0_index = ans.index('<extra_id_0>')
                _result_prefix = ans[:_0_index]
                _result_suffix = ans[_0_index+12:]  # 12 is the length of <extra_id_0>

                results = [self._filter(o, _result_prefix, _result_suffix) for o in outputs]
                ans = [results[0]]
            except ValueError:
                pass
        
        sentences = self.tokenizer_sentence.tokenize(ans[0])
        for i in range(len(sentences)):
            sen = sentences[i]
            find = re.findall(pattern, sen)
            if len(find) > 12 :
                sentences[i] = ''

        sentences = [best_gen_question[1], *sentences]
        
        if join:
            return ' '.join(sentences)
        return sentences

    def highlight(self, query, sentences, tokenized=True):
        if not tokenized:
            sentences = sent_tokenize(sentences)
        sentence_combinations = [[query, sentence] for sentence in sentences]
        similarity_scores = self._softmax(self.model_CE.predict(sentence_combinations))
        return [
            dict(order=i+1, sentence=sen, value=sim)
            for i, (sen, sim) in enumerate(zip(sentences, similarity_scores.tolist()))
        ]

    def _softmax(self, x):
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum(axis=0)