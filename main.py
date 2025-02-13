import os
import io
import logging
from flask import Flask, render_template, request, send_file, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "super-secret-key"

# Configuration
UPLOAD_FOLDER = 'uploads'
STATIC_FOLDER = 'static'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
ALLOWED_PDF_EXTENSIONS = {'pdf'}

# Ensure required folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024  # 30MB limit

# Helper functions
def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_pdf_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_PDF_EXTENSIONS

# Serve sitemap.xml
@app.route('/sitemap.xml')
def serve_sitemap():
    return send_from_directory(STATIC_FOLDER, 'sitemap.xml')

# Routes
@app.route('/')
def index():
    return render_template('removebackground.html')

@app.route('/removebackground')
def removebackground():
    return render_template('removebackground.html')

@app.route('/pdfcompress')
def pdfcompress():
    return render_template('pdfcompress.html')

@app.route('/photoresizer')
def photoresizer():
    return render_template('photoresizer.html')

# Image Resizing Logic
def resize_image(image_data, target_size_kb, width, height, dpi):
    try:
        img = Image.open(io.BytesIO(image_data))
        if img.mode == 'RGBA':
            img = img.convert('RGB')

        if width and height:
            img = img.resize((int(width), int(height)), Image.Resampling.LANCZOS)

        if dpi:
            img.info['dpi'] = (int(dpi), int(dpi))

        quality = 95
        output = io.BytesIO()
        while quality > 5:
            output.seek(0)
            output.truncate()
            img.save(output, format='JPEG', quality=quality, dpi=(int(dpi), int(dpi)) if dpi else None)
            if len(output.getvalue()) <= target_size_kb * 1024:
                break
            quality -= 5

        output.seek(0)
        return output
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return None

@app.route('/resize', methods=['POST'])
def resize():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        if not file or not allowed_image_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400

        target_size = request.form.get('target_size', type=int)
        width = request.form.get('width', type=int)
        height = request.form.get('height', type=int)
        dpi = request.form.get('dpi', type=int)

        if not target_size or target_size <= 0:
            return jsonify({'error': 'Target size must be a positive integer'}), 400

        image_data = file.read()
        resized_image = resize_image(image_data, target_size, width, height, dpi)

        if not resized_image:
            return jsonify({'error': 'Error processing image'}), 500

        return send_file(resized_image, mimetype='image/jpeg', as_attachment=True, download_name='resized_image.jpg')
    except Exception as e:
        logger.error(f"Error in resize endpoint: {str(e)}")
        return jsonify({'error': 'Server error'}), 500

# PDF Compression Logic
def compress_pdf(input_path, output_path, dpi=300, quality=5, target_reduction=50, target_size=None):
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        compressed_size = os.path.getsize(output_path)
        return compressed_size
    except Exception as e:
        logger.error(f"Error during PDF compression: {str(e)}")
        raise

@app.route('/compress', methods=['POST'])
def compress():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if not file or not allowed_pdf_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        dpi = int(request.form.get('dpi', 300))
        quality = int(request.form.get('quality', 5))
        target_reduction = int(request.form.get('target_reduction', 50))
        target_size = request.form.get('target_size')

        original_filename = secure_filename(file.filename)
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        file.save(original_path)

        compressed_path = os.path.join(app.config['UPLOAD_FOLDER'], f"compressed_{original_filename}")
        original_size = os.path.getsize(original_path)
        compressed_size = compress_pdf(original_path, compressed_path, dpi, quality, target_reduction, target_size)

        os.remove(original_path)

        reduction = ((original_size - compressed_size) / original_size) * 100
        return jsonify({'filename': f"compressed_{original_filename}", 'original_size': original_size, 'compressed_size': compressed_size, 'reduction': reduction})
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
