function search() {
    const query = document.getElementById('searchInput').value;
    fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
    })
    .then(response => response.json())
    .then(data => {
        // Clear all columns
        for (let i = 0; i < 5; i++) {
            document.getElementById(`col-${i}`).innerHTML = '';
        }

        // Distribute books among columns
        data.forEach((book, index) => {
            console.log(book)
            const columnIndex = index % 5;
            const bookCard = `
                <div class="book-card">
                    <img src="${book.coverImg}" alt="Book Cover" onclick="showDetails(this)" data-id="${book.id}">
                </div>
            `;
            document.getElementById(`col-${columnIndex}`).innerHTML += bookCard;
        });
    });
}

function showDetails(element) {
    console.log('Show details function called'); // Debug log
    const id = element.getAttribute('data-id');
    console.log('Book ID:', id); // Debug log

    // Fetch book details from the server
    fetch(`/book/${id}`)
        .then(response => response.json())
        .then(book => {
            console.log('Book details fetched:', book); // Debug log

            // Update modal content
            document.getElementById('modalTitle').innerText = book.title;
            document.getElementById('modalAuthor').innerText = book.author;
            document.getElementById('modalGenre').innerText = book.genre;
            document.getElementById('modalDescription').innerText = book.description;
            document.getElementById('modalRating').innerText = 'Rating: ' + book.rating;

            // Clear previous similar books
            for (let i = 0; i < 3; i++) {
                const columnElement = document.getElementById(`col-modal-${i}`);
                if (columnElement) {
                    columnElement.innerHTML = '';
                }
            }

            // Distribute similar books among 3 columns
            console.log(book.similar_item_ids)
            book.similar_item_ids.forEach((id) => {
                console.log(id);
                fetch(`/book/${id}`)
                    .then(response => response.json())
                    .then(similarBook => {
                        const columnIndex = id % 3;
                        const columnElement = document.getElementById(`col-modal-${columnIndex}`);
                        if (columnElement) {
                            const bookCard = `
                                <div class="modal-book-card">
                                    <img src="${similarBook.coverImg}" alt="Book Cover" onclick="showDetails(this)" data-id="${similarBook.id}">
                                </div>
                            `;
                            columnElement.innerHTML += bookCard;
                        }
                    });
            });

            // Show the modal
            var modal = document.getElementById('bookModal');
            modal.style.display = "block";
        })
        .catch(error => console.error('Error fetching book details:', error));
}


function closeModal() {
    var modal = document.getElementById('bookModal');
    modal.style.display = "none";
}

// Close the modal when the user clicks anywhere outside of it
window.onclick = function(event) {
    var modal = document.getElementById('bookModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function exploreBook(element) {
    console.log(element)
}