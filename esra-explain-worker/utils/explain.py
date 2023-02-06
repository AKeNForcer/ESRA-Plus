import torch
from transformers import AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM, T5Tokenizer, T5ForConditionalGeneration
from sentence_transformers import CrossEncoder
from nltk.tokenize import sent_tokenize
import numpy as np

class ExplainService:
    def __init__(self, device='cuda'):
        self.tokenizer_lfqa = AutoTokenizer.from_pretrained("vblagoje/bart_lfqa")
        self.model_lfqa = AutoModelForSeq2SeqLM.from_pretrained("vblagoje/bart_lfqa")
        self.device = device
        self.model_lfqa = self.model_lfqa.to(device)
        self.model_CE = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', max_length=512)
        self.tokenizer_T5 = T5Tokenizer.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')
        self.model_T5 = T5ForConditionalGeneration.from_pretrained('BeIR/query-gen-msmarco-t5-base-v1')


    def explain(self, query, abstract):
        sentences = sent_tokenize(abstract)
        sentence_combinations = [[query, sentence] for sentence in sentences]
        similarity_scores = self.model_CE.predict(sentence_combinations)
        
        qualified_sentences = []
        for i in range(len(sentences)):
            if similarity_scores[i] > 0:
                qualified_sentences.append(sentences[i])
        
        input_ids = self.tokenizer_T5.encode(abstract, return_tensors = 'pt')
        outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.95, num_return_sequences = 10)

        questions = []
        for i in range(len(outputs)):
            questions.append([query, self.tokenizer_T5.decode(outputs[i], skip_special_tokens = True)])
        for sentence in qualified_sentences:
            input_ids = self.tokenizer_T5.encode(sentence, return_tensors = 'pt')
            outputs = self.model_T5.generate(input_ids = input_ids, max_length = 64, do_sample = True, top_p = 0.80, num_return_sequences = 10)
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
            num_beams=10,
            temperature=1.0,
            top_k=None,
            top_p=0.97,
            eos_token_id=self.tokenizer_lfqa.eos_token_id,
            no_repeat_ngram_size=3,
            num_return_sequences=1
        )
        ans = self.tokenizer_lfqa.batch_decode(generated_answers_encoded, skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return ans[0]

    def highlight(self, query, explanation):
        sentences = sent_tokenize(explanation)
        sentence_combinations = [[query, sentence] for sentence in sentences]
        similarity_scores = self._softmax(self.model_CE.predict(sentence_combinations))
        return [
            dict(order=i+1, sentence=sen, value=sim)
            for i, (sen, sim) in enumerate(zip(sentences, similarity_scores.tolist()))
        ]

    def _softmax(self, x):
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum(axis=0)