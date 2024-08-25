const width = window.innerWidth;
const height = window.innerHeight;
const imgWidth = 50;
const imgHeight = 75;
const scaleFactor = 3500;

let books = [];
let visibleBooks = [];
let quadtree;

const svg = d3.select('#explore-container')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

const zoomG = svg.append('g');

const zoom = d3.zoom()
    .scaleExtent([0.05, 20])
    .on('zoom', handleZoom);

svg.call(zoom);

// Fetch book data from the Flask app
fetch('/explore?json=true')
    .then(response => response.json())
    .then(data => {
        books = data;
        quadtree = d3.quadtree()
            .x(d => d.mod_position[0] * scaleFactor)
            .y(d => d.mod_position[1] * scaleFactor)
            .addAll(books);
        initializeBookPlot();
    });

function explore_search() {
    const query = document.getElementById('searchInput').value;
    fetch('/explore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
    })
    .then(response => response.json())
    .then(data => {
        // Distribute books among columns
        let x_position = 0;
        let y_position = 0;
        data.forEach((book, index) => {
            console.log(book)
            x_position += book.position[0];
            y_position += book.position[1];
        });
        x_position /= data.length; // Corrected 'len(data)' to 'data.length'
        y_position /= data.length;

        // Pan and zoom to the average position
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(width / 2 - x_position * scaleFactor, height / 2 - y_position * scaleFactor).scale(1)
        )
    });
}

function initializeBookPlot() {
    const xExtent = d3.extent(books, d => d.mod_position[0] * scaleFactor);
    const yExtent = d3.extent(books, d => d.mod_position[1] * scaleFactor);
    const bboxWidth = xExtent[1] - xExtent[0] + imgWidth;
    const bboxHeight = yExtent[1] - yExtent[0] + imgHeight;

    const scale = Math.min(width / bboxWidth, height / bboxHeight) * 0.9;
    const translateX = (width - bboxWidth * scale) / 2 - xExtent[0] * scale;
    const translateY = (height - bboxHeight * scale) / 2 - yExtent[0] * scale;

    svg.call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
}

function handleZoom(event) {
    zoomG.attr('transform', event.transform);
    updateVisibleBooks(event.transform);
    debounceRenderBooks(event.transform.k);
}

const debounceRenderBooks = debounce((zoomLevel) => {
    renderBooks(zoomLevel);
}, 100);

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function updateVisibleBooks(transform) {
    const visibleArea = {
        x0: -transform.x / transform.k,
        y0: -transform.y / transform.k,
        x1: (width - transform.x) / transform.k,
        y1: (height - transform.y) / transform.k
    };

    visibleBooks = [];
    quadtree.visit((node, x0, y0, x1, y1) => {
        if (!node.length) {
            do {
                const d = node.data;
                const x = d.mod_position[0] * scaleFactor;
                const y = d.mod_position[1] * scaleFactor;
                if (x >= visibleArea.x0 && x <= visibleArea.x1 && y >= visibleArea.y0 && y <= visibleArea.y1) {
                    visibleBooks.push(d);
                }
            } while (node = node.next);
        }
        return x0 > visibleArea.x1 || y0 > visibleArea.y1 || x1 < visibleArea.x0 || y1 < visibleArea.y0;
    });
}

function renderBooks(zoomLevel) {
    const isZoomedOut = zoomLevel < 0.1; // Example threshold
    const images = zoomG.selectAll('image')
        .data(visibleBooks, d => d.coverImg);

    images.enter()
        .append('image')
        .attr('xlink:href', d => isZoomedOut ? 'placeholder.png' : d.coverImg)
        .attr('x', d => d.mod_position[0] * scaleFactor)
        .attr('y', d => d.mod_position[1] * scaleFactor)
        .attr('width', imgWidth * Math.min(1, zoomLevel))
        .attr('height', imgHeight * Math.min(1, zoomLevel))
        .attr('class', 'cover-img')
        .on('click', showModal);

    images.exit().remove();

    // Update existing images' sizes based on zoom level
    images.attr('width', imgWidth * Math.min(1, zoomLevel))
        .attr('height', imgHeight * Math.min(1, zoomLevel))
        .attr('xlink:href', d => isZoomedOut ? 'placeholder.png' : d.coverImg);
}


function showModal(event, book) {
    console.log('Show details function called'); // Debug log
    console.log(book)
    const id = book.id;
    console.log('Book ID:', id); // Debug log
    
    document.getElementById('modalTitle').innerText = book.title;
    document.getElementById('modalAuthor').innerText = 'Author: ' + book.author;
    document.getElementById('modalGenre').innerText = 'Genre: ' + book.genre;
    document.getElementById('modalDescription').innerText = 'Description: ' + book.description;
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
                            <img src="${similarBook.coverImg}" alt="Book Cover" onclick='showModal(event, ${JSON.stringify(similarBook)})' data-id="${similarBook.id}">
                        </div>
                    `;

                    columnElement.innerHTML += bookCard;
                }
            });
    });

    // Show the modal
    var modal = document.getElementById('bookModal');
    modal.style.display = "block";
    
}

// Close the modal when the user clicks anywhere outside of it
window.onclick = function(event) {
    var modal = document.getElementById('bookModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Implement Intersection Observer for lazy loading
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.setAttribute('xlink:href', img.dataset.src);
            observer.unobserve(img);
        }
    });
}, { rootMargin: '100px' });

function lazyLoadImages() {
    zoomG.selectAll('image').each(function() {
        const img = d3.select(this);
        img.attr('data-src', img.attr('xlink:href'))
            .attr('xlink:href', ''); // Placeholder or low-res image URL
        observer.observe(this);
    });
}

// Call lazyLoadImages after initial render
svg.on('zoom.end', lazyLoadImages);