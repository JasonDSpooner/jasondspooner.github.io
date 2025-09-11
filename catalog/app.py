import os
import json

# Base directory where category folders are located
base_dir = r'C:\store\dev\chilliboysit.github.io'

# List all category folders
categories = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]

# HTML template for index.html
index_html = """
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
"""

for cat in categories:
    cat_dir = os.path.join(base_dir, cat)
    images = sorted([f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.png', '.gif', '.jpeg'))])
    if images:
        first_img = images[0]
        index_html += f"""
            <div class="col-md-4 mb-4">
                <a href="{cat}.html" class="text-decoration-none">
                    <div class="card">
                        <img src="{cat}/{first_img}" class="card-img-top img-thumbnail" alt="{cat}">
                        <div class="card-body text-center">
                            <h5 class="card-title">{cat.capitalize()}</h5>
                        </div>
                    </div>
                </a>
            </div>
        """

index_html += """
        </div>
    </div>
</body>
</html>
"""

# Write index.html
with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(index_html)

# For each category, generate HTML and JSON
for cat in categories:
    cat_dir = os.path.join(base_dir, cat)
    images = sorted([f for f in os.listdir(cat_dir) if f.lower().endswith(('.jpg', '.png', '.gif', '.jpeg'))])
    
    if not images:
        continue
    
    # Generate JSON with placeholders
    json_data = {}
    for img in images:
        json_data[img] = {
            "title": "Placeholder Title",
            "description": "Placeholder Description",
            "price": "0.00"
        }
    
    json_path = os.path.join(base_dir, f'{cat}.json')
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(json_data, jf, indent=4)
    
    # Generate category.html
    cat_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{cat.capitalize()} Catalog</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body>
    <div class="container my-5">
        <h1 class="text-center mb-4">{cat.capitalize()} Catalog</h1>
        <a href="index.html" class="btn btn-primary mb-3">Back to Main</a>
        <div class="row">
    """

    for img in images:
        cat_html += f"""
            <div class="col-md-3 mb-4">
                <img src="{cat}/{img}" class="img-thumbnail cursor-pointer" alt="{img}" onclick="openModal('{img}')">
            </div>
        """

    cat_html += """
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
                    <p id="itemDesc">Description</p>
                    <p id="itemPrice">Price: $0.00</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let itemData = {};
        fetch('{cat}.json')
            .then(response => response.json())
            .then(data => {
                itemData = data;
            })
            .catch(error => console.error('Error loading JSON:', error));
        
        function openModal(imgName) {
            const fullPath = '{cat}/' + imgName;
            document.getElementById('largeImg').src = fullPath;
            document.getElementById('itemTitle').innerText = itemData[imgName]?.title || 'No title';
            document.getElementById('itemDesc').innerText = itemData[imgName]?.description || 'No description';
            document.getElementById('itemPrice').innerText = 'Price: $' + (itemData[imgName]?.price || '0.00');
            const myModal = new bootstrap.Modal(document.getElementById('detailModal'));
            myModal.show();
        }
    </script>
</body>
</html>
    """
    
    # Write category.html
    with open(os.path.join(base_dir, f'{cat}.html'), 'w', encoding='utf-8') as f:
        f.write(cat_html)

print("Catalog generation complete. Check C:\\temp for index.html and category files.")