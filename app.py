import os
from flask import Flask, render_template, request, jsonify
import pandas as pd
import cohere
from annoy import AnnoyIndex
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Load the book data
df = pd.read_json('books.json')
df['product'] = df['rating'] * df['numRatings'] * df['likedPercent'] * df['bbeScore']

# Get top 1000 books based on product
top_books = df.nlargest(1000, 'product')
top_books['column_index'] = top_books.index % 5
columns = {f'col-{i}': top_books[top_books['column_index'] == i].to_dict(orient='records') for i in range(5)}

# Initialize Cohere client and search index
co = cohere.Client(os.getenv('API_KEY'))
search_index = AnnoyIndex(1024, 'angular')
search_index.load('book_search.ann')

def get_book_details(book):
    return {
        'id': int(book['id']),
        'title': book['title'],
        'author': book['author'],
        'genre': book['genres'],
        'description': book['description'], 
        'coverImg': book['coverImg'],
        'rating': float(book['rating']),
        'setting': book['setting'],
        'similar_item_ids': book['similar_item_ids'],
        'position': book['position']
    }

def perform_search(query, n_results=50):
    query_embed = co.embed(texts=[query], model="embed-english-v3.0", input_type="search_query").embeddings[0]
    similar_item_ids, distances = search_index.get_nns_by_vector(query_embed, n_results, include_distances=True)
    
    results = []
    for i, dist in zip(similar_item_ids, distances):
        book = df.iloc[i]
        result = get_book_details(book)
        result['similarity'] = 1 - dist
        results.append(result)
    
    return results

@app.route('/')
def home():
    return render_template('index.html', columns=columns)

@app.route('/', methods=['POST'])
def search():
    query = request.json['query']
    return jsonify(perform_search(query))

@app.route('/book/<int:book_id>')
def get_book_details_route(book_id):
    book = df.iloc[book_id]
    return jsonify(get_book_details(book))

@app.route('/explore')
def explore():
    if 'json' in request.args:
        df['mod_position'] = df['position'].apply(lambda x: [i for i in x])
        return jsonify(df.to_dict(orient='records'))
    return render_template('explore.html')

@app.route('/explore', methods=['POST'])
def explore_search():
    query = request.json['query']
    results = perform_search(query, n_results=1)
    return jsonify([{'id': result['id'], 'position': result['position']} for result in results])

if __name__ == '__main__':
    app.run(debug=True)