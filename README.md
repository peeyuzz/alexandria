# Alexandria

**Alexandria** is a semantic search engine that enables users to explore over 30,000 books using natural language queries. It leverages modern machine learning techniques for embedding-based search and is built using Flask, Python, JavaScript, HTML, and CSS.

## Features
- **Semantic Search**: Search for books based on vibes, topics, or natural language descriptions.
- **Interactive Interface**: Clean and user-friendly UI for seamless book exploration.
- **Fast Performance**: Handles large datasets efficiently.

## Repository Structure
```
static/          # Static files (CSS, JS, images)
templates/       # HTML templates
.gitignore       # Git ignore rules
README.md        # Project documentation
app.py           # Flask application
book_search.ann  # Annoy index for semantic search
books.json       # Metadata of books
build_index.py   # Script to build Annoy index
embeddings.npy   # Precomputed book embeddings
get_embeddings.py # Script to generate embeddings
get_positions.py # Utility to compute book positions
requirements.txt # Python dependencies
rough.ipynb      # Notebook for experiments
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your_username/alexandria.git
   cd alexandria
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```bash
   python app.py
   ```

4. Access the application at `http://127.0.0.1:5000/`.

## Usage
- Open the web interface.
- Enter natural language queries to explore books.
- View detailed book information and recommendations.
