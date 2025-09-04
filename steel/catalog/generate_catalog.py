import json

# Load the JSON data
with open('stairs.json', 'r') as f:
    data = json.load(f)

# Generate HTML content
html = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stair Catalog - Chilli Boys</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; background: #f4f4f4; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            padding: 20px;
        }
        .thumbnail {
            width: 100%;
            height: auto;
            cursor: pointer;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        #detail {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            overflow: auto;
        }
        #inner {
            display: flex;
            max-width: 90%;
            margin: 50px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        #img-half {
            width: 50%;
        }
        #img-half img {
            width: 100%;
            height: auto;
        }
        #info-half {
            width: 50%;
            padding: 20px;
            box-sizing: border-box;
        }
        #info-half h2 { margin-top: 0; }
        #price { color: #007bff; font-weight: bold; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
    </style>
</head>
<body>
    <h1 style="text-align: center;">Stair Catalog</h1>
    <div class="grid">
'''

# Add thumbnails for non-hidden items
for item in data:
    if not item['hidden']:
        html += f'<img src="{item["image"]}" class="thumbnail" onclick="showDetail({item["id"]})" alt="Stair {item["id"]}">\n'

html += '''
    </div>
    
    <div id="detail" onclick="closeDetail()">
        <div id="inner" onclick="event.stopPropagation();">
            <div id="img-half">
                <img id="full-img" src="" alt="Full Stair Image">
            </div>
            <div id="info-half">
                <span class="close" onclick="closeDetail()">&times;</span>
                <h2 id="title"></h2>
                <p id="description"></p>
                <p id="price"></p>
            </div>
        </div>
    </div>
    
    <script>
        var stairs = ''' + json.dumps(data) + ''';
        
        function showDetail(id) {
            let item = stairs.find(x => x.id === id);
            if (item) {
                document.getElementById('full-img').src = item.image;
                document.getElementById('title').innerText = item.title || 'Untitled Stair';
                document.getElementById('description').innerText = item.description || 'No description available.';
                let priceElem = document.getElementById('price');
                if (item.price) {
                    priceElem.innerText = 'Price: ' + item.price;
                    priceElem.style.display = 'block';
                } else {
                    priceElem.innerText = '';
                    priceElem.style.display = 'none';
                }
                document.getElementById('detail').style.display = 'block';
            }
        }
        
        function closeDetail() {
            document.getElementById('detail').style.display = 'none';
        }
    </script>
</body>
</html>
'''

# Write to HTML file
with open('stairs_catalog.html', 'w') as f:
    f.write(html)

print('Catalog generated: stairs_catalog.html')