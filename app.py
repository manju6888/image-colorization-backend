import ssl
ssl._create_default_https_context = ssl._create_unverified_context

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from model.colorizer import ImageColorizer
import base64

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print("=" * 50)
print("Loading Image Colorizer...")
print("=" * 50)
colorizer = ImageColorizer()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_base64(image_path):
    try:
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except:
        return None

@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'Image Colorization API!', 'status': 'success'})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/colorize', methods=['POST', 'OPTIONS'])
def colorize_image():
    if request.method == 'OPTIONS':
        return '', 200

    if 'image' not in request.files:
        return jsonify({'status': 'error', 'message': 'No image'}), 400

    file = request.files['image']
    if not allowed_file(file.filename):
        return jsonify({'status': 'error', 'message': 'Invalid file'}), 400

    try:
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = str(uuid.uuid4())
        input_path = os.path.join(UPLOAD_FOLDER, f'{filename}_in.{ext}')
        output_path = os.path.join(UPLOAD_FOLDER, f'{filename}_out.jpg')
        file.save(input_path)

        result = colorizer.colorize(input_path, output_path)

        if result['status'] == 'success':
            original_b64 = image_to_base64(input_path)
            colorized_b64 = image_to_base64(output_path)

            try:
                os.remove(input_path)
                os.remove(output_path)
            except:
                pass

            return jsonify({
                'status': 'success',
                'original': original_b64,
                'colorized': colorized_b64
            }), 200
        return jsonify(result), 500

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print(f"Server Running at http://localhost:{port}")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=port)