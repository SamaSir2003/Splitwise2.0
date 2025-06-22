from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from PIL import Image
import io
import re
import os

app = Flask(__name__)

api_key=os.environ.get('GENAI_API_KEY')
genai.configure(api_key="AIzaSyDpZzAZpzubC-Fyu_oeHR2CYNrTFW8XmW0")
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/extract-bill', methods=['POST'])
def extract_bill():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    image_bytes = file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    prompt = (
        "Extract all the food items and their prices respectively from this image. "
        "Return a JSON array of objects with 'name' and 'price' fields."
    )

    response = model.generate_content([prompt, image])
    import json
    try:
        match = re.search(r"\[\s*{.*}\s*\]", response.text, re.DOTALL)
        if match:
            items = json.loads(match.group(0))
        else:
            items = []
        print(items)
    except Exception:
        items = []
    return jsonify({
        'success': True,
        'items': items,
        'raw_response': response.text
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)