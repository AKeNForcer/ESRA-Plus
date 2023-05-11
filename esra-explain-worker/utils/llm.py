import time
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from fastchat.conversation import conv_templates, SeparatorStyle
import sys

sys.path.append("utils/FastChat/repositories/GPTQ-for-LLaMa")
sys.path.insert(0, "utils/FastChat/repositories/GPTQ-for-LLaMa")

class LlmPipeline():
    
    @torch.inference_mode()
    def generate_stream(self, tokenizer, model, params, device,
                        context_len=2048, stream_interval=2):
        """Adapted from fastchat/serve/model_worker.py::generate_stream"""

        prompt = params["prompt"]
        l_prompt = len(prompt)
        temperature = float(params.get("temperature", 1.0))
        max_new_tokens = int(params.get("max_new_tokens", 256))
        stop_str = params.get("stop", None)

        input_ids = tokenizer(prompt).input_ids
        output_ids = list(input_ids)

        max_src_len = context_len - max_new_tokens - 8
        input_ids = input_ids[-max_src_len:]

        for i in range(max_new_tokens):
            if i == 0:
                out = model(
                    torch.as_tensor([input_ids], device=device), use_cache=True)
                logits = out.logits
                past_key_values = out.past_key_values
            else:
                attention_mask = torch.ones(
                    1, past_key_values[0][0].shape[-2] + 1, device=device)
                out = model(input_ids=torch.as_tensor([[token]], device=device),
                            use_cache=True,
                            attention_mask=attention_mask,
                            past_key_values=past_key_values)
                logits = out.logits
                past_key_values = out.past_key_values

            last_token_logits = logits[0][-1]
            if temperature < 1e-4:
                token = int(torch.argmax(last_token_logits))
            else:
                probs = torch.softmax(last_token_logits / temperature, dim=-1)
                token = int(torch.multinomial(probs, num_samples=1))

            output_ids.append(token)

            if token == tokenizer.eos_token_id:
                stopped = True
            else:
                stopped = False

            if i % stream_interval == 0 or i == max_new_tokens - 1 or stopped:
                output = tokenizer.decode(output_ids, skip_special_tokens=True)
                pos = output.rfind(stop_str, l_prompt)
                if pos != -1:
                    output = output[:pos]
                    stopped = True
                yield output

            if stopped:
                break

        del past_key_values

    def __init__(self, device='cuda', model_name='anon8231489123/vicuna-13b-GPTQ-4bit-128g', 
                 num_gpus='1', wbits=4, temperature=0.1, conv_template='v1'):
        self.device = device
        self.model_name = model_name
        self.num_gpus = num_gpus
        self.wbits = wbits
        self.temperature = temperature
        self.conv_template = conv_template
        
        # Model
        if device == "cuda":
            kwargs = {"torch_dtype": torch.float16}
            if num_gpus == "auto":
                kwargs["device_map"] = "auto"
            else:
                num_gpus = int(num_gpus)
                if num_gpus != 1:
                    kwargs.update({
                        "device_map": "auto",
                        "max_memory": {i: "13GiB" for i in range(num_gpus)},
                    })
        elif device == "cpu":
            kwargs = {}
        else:
            raise ValueError(f"Invalid device: {device}")

        tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.tokenizer = tokenizer

        if wbits > 0:
            from fastchat.serve.load_gptq_model import load_quantized

            print("Loading GPTQ quantized model...")
            model = load_quantized(model_name)
        else:
            model = AutoModelForCausalLM.from_pretrained(model_name,
                low_cpu_mem_usage=True, **kwargs)

        if device == "cuda" and num_gpus == 1:
            model.cuda()
            
        self.model = model
    
    
    def infer(self, inp, conv=None, max_new_tokens=128):
        if conv is None:
            conv = conv_templates[self.conv_template].copy()
        
        conv.append_message(conv.roles[0], inp) #Appending Input
        conv.append_message(conv.roles[1], None) #Appending Assitant:, Waiting for the right response from the model
        prompt = conv.get_prompt()
        params = {
            "model": self.model_name,
            "prompt": prompt,
            "temperature": self.temperature,
            "max_new_tokens": max_new_tokens,
            "stop": conv.sep if conv.sep_style == SeparatorStyle.SINGLE else conv.sep2,
        }
        for outputs in self.generate_stream(self.tokenizer, self.model.to(self.device), params, self.device):
            pass
        outputs = outputs[len(prompt) + 1:].strip()
        conv.messages[-1][-1] = " ".join(outputs)
        return outputs, conv