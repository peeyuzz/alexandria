import re
import os
import pandas as pd
import numpy as np
import cohere
from annoy import AnnoyIndex
from dotenv import load_dotenv
from tqdm import tqdm
# Build the search index
embeds = np.load('embeddings.npy')
print("Building search index...")
search_index = AnnoyIndex(len(embeds[0]), 'angular')

for i, embed in enumerate(tqdm(embeds)):
    search_index.add_item(i, embed)

search_index.build(50)  # 50 trees for better accuracy
search_index.save('book_search.ann')

print("Search index built and saved as 'book_search.ann'")