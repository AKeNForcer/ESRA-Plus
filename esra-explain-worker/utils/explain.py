import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM, T5Tokenizer, T5ForConditionalGeneration, MT5ForConditionalGeneration
from sentence_transformers import CrossEncoder
from nltk.tokenize import sent_tokenize
import nltk.data
import numpy as np
import re
from datetime import datetime

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
        before = datetime.now()

        sentences = sent_tokenize(abstract)
        sentence_combinations = [[query, sentence] for sentence in sentences]
        similarity_scores = self.model_CE.predict(sentence_combinations)

        curr = datetime.now(); print("similarity_scores = self.model_CE.predict(sentence_combinations)", curr - before); before = curr
        
#         qualified_sentences = []
#         for i in range(len(sentences)):
#             if similarity_scores[i] > 0:
#                 qualified_sentences.append(sentences[i])
        
        input_ids = self.tokenizer_T5.encode(abstract, return_tensors = 'pt')
        outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.90, num_return_sequences = 5)

        curr = datetime.now(); print("outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.90, num_return_sequences = 5)", curr - before); before = curr

        questions = []
        for i in range(len(outputs)):
            questions.append([query, self.tokenizer_T5.decode(outputs[i], skip_special_tokens = True)])
        # for sentence in qualified_sentences:
        #     input_ids = self.tokenizer_T5.encode(sentence, return_tensors = 'pt')
        #     outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.90, num_return_sequences = 3)
        #     for i in range(len(outputs)):
        #         questions.append([query, self.tokenizer_T5.decode(outputs[i], skip_special_tokens = True)])
        
        curr = datetime.now(); print("for sentence in qualified_sentences:", curr - before); before = curr

        similarity_scores_questions = self.model_CE.predict(questions)
        best_gen_question = questions[np.argmax(similarity_scores_questions)]
        second_gen_question = sorted([q for s,q in zip(similarity_scores_questions, questions)])[1]
        documents = [abstract]
        conditioned_doc = "<P> " + " <P> ".join([d for d in documents])
        query_and_docs = "question: {} context: {}".format(best_gen_question[1], conditioned_doc)

        curr = datetime.now(); print("similarity_scores_questions = self.model_CE.predict(questions)", curr - before); before = curr

        model_input = self.tokenizer_lfqa(query_and_docs, truncation=True, padding=True, return_tensors="pt")
        generated_answers_encoded = self.model_lfqa.generate(
            input_ids=model_input["input_ids"].to(self.device),
            attention_mask=model_input["attention_mask"].to(self.device),
            min_length=64,
            max_length=128,
            do_sample=False, 
            early_stopping=False,
            num_beams=20,
            temperature=1,
            top_k=None,
            top_p=0.97,
            eos_token_id=self.tokenizer_lfqa.eos_token_id,
            no_repeat_ngram_size=4,
            num_return_sequences=1)
        
        
        curr = datetime.now(); print("generated_answers_encoded = self.model_lfqa.generate(", curr - before); before = curr
        
        ans = self.tokenizer_lfqa.batch_decode(generated_answers_encoded, skip_special_tokens=True, clean_up_tokenization_spaces=True)        
        print("ans", ans)
        if "For example," not in abstract:
            try:
                idx = ans[0].index("For example,")
                ans[0] = ans[0][:idx]
            except ValueError:
                pass
        
        sentences = sent_tokenize(ans[0])
        sentence_combinations = [[abstract, sentence] for sentence in sentences]
        similarity_scores = self.model_CE.predict(sentence_combinations)
        if similarity_scores.mean()<0:
            ans = self.explain2(query, abstract)
            
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

        sentences = [*sentences]
        
        curr = datetime.now(); print('''if "I'm not sure" in ans[0] :''', curr - before); before = curr

        if join:
            return ' '.join(sentences)
        return ans

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
    
    def _calc_similiarity(self, query, sentences):
        if type(query) != type([]):
            query = [query]
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

    def _filter_overview_question(self,
                questions,
                template_questions,
                verbose):
        questions_template_sim = self._calc_similiarity(
            [f"{t}" for t in template_questions], questions)
        if verbose: print("questions_template_sim:\n", questions_template_sim)
            
        final_questions = []
        for i in range(0, len(questions_template_sim), len(questions)):
            final_questions.append(
                max(
                    questions_template_sim[i:i+len(questions)],
                    key=lambda x: x[0]
                )[1][1]
            )
        if verbose: print("final_questions:\n", final_questions)
        return final_questions
    
    def _generate_answer(self, question, documents):
        conditioned_doc = "<P> " + " <P> ".join(documents)
        query_and_docs = "question: {} context: {}".format(question, conditioned_doc)
        
        model_input = self.tokenizer_lfqa(query_and_docs, truncation=True, padding=True, return_tensors="pt")
        generated_answers_encoded = self.model_lfqa.generate(
            input_ids=model_input["input_ids"].to(self.device),
            attention_mask=model_input["attention_mask"].to(self.device),
            min_length=64,
            max_length=128,
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
        sentences = [*sentences]
        return ' '.join(sentences)

    def overview(self, 
                 query, 
                 documents,
                 num_return_sequences=5,
                 similarity_threshold=2, 
                 min_pass=5,
                 template_questions=["What is this?"],
                 verbose=False):
        questions = self.gen_question(query, documents, num_return_sequences, similarity_threshold, min_pass, verbose)
        filtered_questions = self._filter_overview_question(
            questions,
            template_questions,
            verbose
        )
        return [self._generate_answer(q, documents) for q in filtered_questions]
    
    def explain2(self, query, abstract, verbose=False):
        sentences = sent_tokenize(abstract)
        sim_kw = self._calc_similiarity('We show, propose, present, introduce', sentences)
        if verbose: print("sim_kw", sim_kw)

        sim_kw_i_max = np.argmax([s[0] for s in sim_kw])
        sim_kw_max = sim_kw[sim_kw_i_max]
        del sim_kw[sim_kw_i_max]
        if verbose: print("\nsim_kw_max", sim_kw_max)
        
        sim_q = self._calc_similiarity(query, [s[1][1] for s in sim_kw])
        if verbose: print("\nsim_q", sim_q)
        sim_q_max = max(sim_q, key=lambda x: x[0])
        if verbose: print("\nsim_q_max", sim_q_max)
        
        preprocess_text = (f"{sim_q_max[1][1]} {sim_kw_max[1][1]}").strip().replace("\n"," ").strip()
#         t5_prepared_Text = "summarize: " + preprocess_text
#         tokenized_text = self.T5_arxiv_tokenizer.encode(t5_prepared_Text, return_tensors="pt", add_special_tokens=True).to(self.device)
#         summary_ids = self.T5_arxiv_model.generate(
#             tokenized_text,
#             num_beams=4,
#             no_repeat_ngram_size=2,
#             min_length=30,
#             max_length=100,
#             early_stopping=True)
#         ans = [self.T5_arxiv_tokenizer.decode(g, skip_special_tokens=True, clean_up_tokenization_spaces=True) for g in summary_ids]#[0]
        
        return [preprocess_text]
        
        encoded = self.T5_arxiv_tokenizer.encode_plus(ans, add_special_tokens=True, return_tensors='pt')
        input_ids = encoded['input_ids'].to(self.device)

        # Generaing 20 sequences with maximum length set to 5
        outputs = self.T5_arxiv_model.generate(
            input_ids=input_ids, 
            num_beams=30,
            num_return_sequences=10,
            max_length=30)
        
        _0_index = ans.index('<extra_id_0>')
        _result_prefix = ans[:_0_index]
        _result_suffix = ans[_0_index+12:]  # 12 is the length of <extra_id_0>

        results = [self._filter(o, _result_prefix, _result_suffix) for o in outputs]
        ans = [results[0]]

        return ans

        # return self.T5_arxiv_tokenizer.batch_decode(outputs, skip_special_tokens=True, clean_up_tokenization_spaces=True)
