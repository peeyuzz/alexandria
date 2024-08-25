# build_index.py
import re
import os
import pandas as pd
import numpy as np
import cohere
from annoy import AnnoyIndex
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables
load_dotenv()
print(os.getenv('API_KEY'))

# Load the book data
df = pd.read_csv('books.csv')

# Combine relevant columns to create context
df['context'] = df.apply(lambda row: f"title: {row['title']}. author: {row['author']}. Description: {row['description']}. Characters: {row['characters']}. Setting: {row['setting']}. Genres: {row['genres']}", axis=1)

# Initialize Cohere client
co = cohere.Client(os.getenv('API_KEY'))

def clean_text(text):
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'[^a-zA-Z0-9\s\.,!?]', '', text)
    return text

texts = []
for text in tqdm(list(df['context']), desc = "Preparing texts..."):
    cleaned_text = clean_text(text)
    texts.append(cleaned_text)

embeds = []
text_chunks = [texts[i:i+96] for i in range(0, len(texts), 96)]
for chunk in tqdm(text_chunks, desc="Generating embeddings..."):
    chunk_embeds = co.embed(
        model="embed-english-v3.0",
        input_type="search_document",
        texts=chunk
    ).embeddings
    embeds.extend(chunk_embeds)
    
np.save('embeddings.npy', np.array(embeds))
print("Embeddings saved as 'embeddings.npy;")

