import umap
import numpy as np
import pandas as pd

embeds = np.load("embeddings.npy")
df = pd.read_json("books.json")

reducer = umap.UMAP(n_neighbors=50, n_components=2) 
umap_embeds = reducer.fit_transform(embeds)

np_umap_embeds = np.array(umap_embeds)

df['position'] = np_umap_embeds.tolist()
df.to_json("books.json", orient='records')