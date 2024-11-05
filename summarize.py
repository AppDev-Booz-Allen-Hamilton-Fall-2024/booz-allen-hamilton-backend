from pdfminer.high_level import extract_text
import math
from nltk.tokenize import sent_tokenize
import textwrap
import nltk
nltk.download('punkt')
from transformers import BartTokenizer, BartForConditionalGeneration

tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn')
def summarize(text):
    inputs = tokenizer.encode("" + text, return_tensors='pt', max_length=1024, truncation=True)
    summary_ids = model.generate(inputs, max_length=200, min_length=20, length_penalty=2.0, num_beams=4, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

def split_text(text, max_chunk_size = 200):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = ''

    for sentence in sentences:
        if len(current_chunk.split()) + len(sentence.split()) <= max_chunk_size:
            current_chunk += ' ' + sentence
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def summary(doc_1):
    text_1 = extract_text(doc_1)
    chunks = split_text(text_1, max_chunk_size= max(len(text_1.split())//10, 200))
    summaries = []
    for chunk in chunks:
        summary = summarize(chunk)
        summary.replace("summarize: ", "")
        summaries.append(summary)
    final_summary = ' '.join(summaries)
    final_summary.replace("summarize: ", "")
    wrapped_text = textwrap.fill(final_summary, width=120)
    return wrapped_text
