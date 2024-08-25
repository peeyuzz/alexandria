# app.py
import os
from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import json
import umap
import cohere
from annoy import AnnoyIndex
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Load the book data
df = pd.read_json('books.json')
# Compute the product column using vectorized operations
df['product'] = df['rating'] * df['numRatings'] * df['likedPercent'] * df['bbeScore']

# Get top 1000 books based on product
top_books = df.nlargest(1000, 'product')
# Distribute books into columns using vectorized operations
top_books['column_index'] = top_books.index % 5
columns = {f'col-{i}': top_books[top_books['column_index'] == i].to_dict(orient='records') for i in range(5)}


# Initialize Cohere client
co = cohere.Client(os.getenv('API_KEY'))

# Load pre-built index
search_index = AnnoyIndex(1024, 'angular')  # Assuming embed-english-v3.0 outputs 1024-dimensional vectors
search_index.load('book_search.ann')

@app.route('/')
def home():
    return render_template('index.html', columns=columns)

@app.route('/', methods=['GET','POST'])
def search():
    query = request.json['query']
        
    # Get the query's embedding
    query_embed = co.embed(texts=[query],
                           model="embed-english-v3.0",
                           input_type="search_query").embeddings[0]
    
    # Retrieve the nearest neighbors
    similar_item_ids, distances = search_index.get_nns_by_vector(query_embed, 50, include_distances=True)
    
    # Format the results
    results = []
    for i, dist in zip(similar_item_ids, distances):
        book = df.iloc[i]
        results.append({
            'id': int(book['id']),
            'title': book['title'],
            'author': book['author'],
            'genre': book['genres'],
            'description': book['description'], 
            'coverImg': book['coverImg'],
            'rating': book['rating'],
            'setting': book['setting'],
            'similar_item_ids': book['similar_item_ids'],
            'similarity': 1 - dist,  # Convert distance to similarity
            'position': book['position']
        })
    
    return jsonify(results)

@app.route('/book/<int:book_id>')
def get_book_details(book_id):
    # Retrieve the book details using the book ID
    book = df.iloc[book_id]

    # Convert pandas types to native Python types
    book_details = {
        'id': int(book['id']),  # Convert int64 to int
        'title': book['title'],
        'author': book['author'],
        'genre': book['genres'],
        'description': book['description'], 
        'coverImg': book['coverImg'],
        'rating': float(book['rating']),  # Ensure rating is a float
        'setting': book['setting'],
        'similar_item_ids': book['similar_item_ids'],
        'position': book['position']
    }
    
    return jsonify(book_details)

@app.route('/explore')
def explore():
    if 'json' in request.args:
        # Distribute books into columns
        # temp_df =  df[['coverImg', 'title', 'author', 'description', 'position']]
        df['mod_position'] = df['position'].apply(lambda x: [i  for i in x])
        books_list = df.to_dict(orient='records')

        return jsonify(books_list)
    else:
        return render_template('explore.html')

@app.route('/explore', methods=['GET','POST'])
def explore_search():
    query = request.json['query']
        
    # Get the query's embedding
    query_embed = co.embed(texts=[query],
                           model="embed-english-v3.0",
                           input_type="search_query").embeddings[0]
    
    
    # Retrieve the nearest neighbors
    similar_item_ids, distances = search_index.get_nns_by_vector(query_embed, 1, include_distances=True)
    
    # Format the results
    results = []
    for i, dist in zip(similar_item_ids, distances):
        book = df.iloc[i]
        results.append({
            'id': int(book['id']),
            'position': book['position']
        })
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)