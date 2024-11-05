from gliner import GLiNER
import pandas as pd
from pdfminer.high_level import extract_text
model_name = "urchade/gliner_mediumv2.1"
model = GLiNER.from_pretrained(model_name)
model.eval()
labels = ["department", "state", "policy", "requirement"]
def text(doc):
    return extract_text(doc)
text_1 = text('/Users/rohan/booz_allen/booz-allen-hamilton-backend/policies/PA/055_0052.pdf')
entities = model.predict_entities(text_1, labels, threshold=0.1)
df = pd.DataFrame(entities, columns=['text', 'label', 'score'])
keywords = []
filtered_df = df[df['label'] != 'state']
filtered_df = filtered_df.sort_values('score', ascending=False)
if df[df['label'] == 'state'] is not None:
  keywords = (filtered_df['text'].head(4).to_list())
  keywords.append(df[df['label'] == 'state'].max()['text'])
else:
  keywords = filtered_df['text'].head(5).to_list()
clean = [keyword.replace('\n\n', ' ') for keyword in keywords]