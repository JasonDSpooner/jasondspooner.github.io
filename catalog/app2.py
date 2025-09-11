import os
import json
import sqlite3
from flask import Flask, render_template_string, request, redirect, url_for, send_from_directory

app = Flask(__name__)

# Base directory where category folders are located
base_dir = r'C:\store\dev\chilliboysit.github.io'
db_path = os.path.join(base_dir, 'catalog.db')

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS items (
            category TEXT,
            image TEXT,
            title TEXT,
            description TEXT,
            price TEXT,
            PRIMARY KEY (category, image)
        )
    ''')
    conn.commit()
    conn.close()

# Populate DB with placeholders if empty
def populate_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    categories = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    for cat in categories:
        cat_dir = os.path.join(base_dir, cat)
        images = sorted([f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.png', '.gif', '.jpeg'))])
        for img in images:
            cursor.execute('''
                INSERT OR IGNORE INTO items (category, image, title, description, price)
                VALUES (?, ?, ?, ?, ?)
            ''', (cat, img, "Placeholder Title", "Placeholder Description", "0.00"))
    conn.commit()
    conn.close()

# Route to serve images
@app.route('/image/<cat>/<img>')
def serve_image(cat, img):
    return send_from_directory(os.path.join(base_dir, cat), img)

# Main index route
@app.route('/')
def index():
    categories = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    category_previews = {}
    for cat in categories:
        cat_dir = os.path.join(base_dir, cat)
        images = sorted([f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.png', '.gif', '.jpeg'))])
        if images:
            category_previews[cat] = images[0]
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Main Catalog</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container my-5">
        <h1 class="text-center mb-4">Main Catalog</h1>
        <div class="row">
            {% for cat, first_img in category_previews.items() %}
            <div class="col-md-4 mb-4">
                <a href="/{{ cat }}" class="text-decoration-none">
                    <div class="card">
                        <img src="/image/{{ cat }}/{{ first_img }}" class="card-img-top img-thumbnail" alt="{{ cat }}">
                        <div class="card-body text-center">
                            <h5 class="card-title">{{ cat.capitalize() }}</h5>
                        </div>
                    </div>
                </a>
            </div>
            {% endfor %}
        </div>
    </div>
</body>
</html>
    ''', category_previews=category_previews)

# Category route
@app.route('/<cat>')
def category(cat):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT image, title, description, price FROM items WHERE category = ?', (cat,))
    items = cursor.fetchall()
    conn.close()
    images = [row[0] for row in items]
    item_data = {row[0]: {'title': row[1], 'description': row[2], 'price': row[3]} for row in items}
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ cat.capitalize() }} Catalog</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <div class="container my-5">
        <h1 class="text-center mb-4">{{ cat.capitalize() }} Catalog</h1>
        <a href="/" class="btn btn-primary mb-3">Back to Main</a>
        <div class="row">
            {% for img in images %}
            <div class="col-md-3 mb-4">
                <img src="/image/{{ cat }}/{{ img }}" class="img-thumbnail cursor-pointer" alt="{{ img }}" onclick="openModal('{{ img }}')">
            </div>
            {% endfor %}
        </div>
    </div>
    
    <!-- Detail Modal -->
    <div class="modal fade" id="detailModal" tabindex="-1" aria-labelledby="detailModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="itemTitle">Title</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <img id="largeImg" src="" class="img-fluid mb-3" alt="Large Image">
                    <form action="/update_item" method="post">
                        <input type="hidden" name="category" id="itemCategory">
                        <input type="hidden" name="image" id="itemImage">
                        <div class="mb-3">
                            <label for="itemTitleInput" class="form-label">Title</label>
                            <input type="text" class="form-control" id="itemTitleInput" name="title">
                        </div>
                        <div class="mb-3">
                            <label for="itemDescInput" class="form-label">Description</label>
                            <textarea class="form-control" id="itemDescInput" name="description" rows="3"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="itemPriceInput" class="form-label">Price</label>
                            <input type="text" class="form-control" id="itemPriceInput" name="price">
                        </div>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        const itemData = {{ item_data | tojson }};
        function openModal(imgName) {
            const fullPath = '/image/{{ cat }}/' + imgName;
            document.getElementById('largeImg').src = fullPath;
            document.getElementById('itemTitle').innerText = itemData[imgName].title || 'No title';
            document.getElementById('itemCategory').value = '{{ cat }}';
            document.getElementById('itemImage').value = imgName;
            document.getElementById('itemTitleInput').value = itemData[imgName].title || '';
            document.getElementById('itemDescInput').value = itemData[imgName].description || '';
            document.getElementById('itemPriceInput').value = itemData[imgName].price || '0.00';
            const myModal = new bootstrap.Modal(document.getElementById('detailModal'));
            myModal.show();
        }
    </script>
</body>
</html>
    ''', cat=cat, images=images, item_data=item_data)

# Update item route
@app.route('/update_item', methods=['POST'])
def update_item():
    category = request.form['category']
    image = request.form['image']
    title = request.form['title']
    description = request.form['description']
    price = request.form['price']
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE items SET title = ?, description = ?, price = ?
        WHERE category = ? AND image = ?
    ''', (title, description, price, category, image))
    conn.commit()
    conn.close()
    return redirect(url_for('category', cat=category))

if __name__ == '__main__':
    init_db()
    populate_db()
    app.run(debug=True)