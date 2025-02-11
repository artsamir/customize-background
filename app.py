import os
import logging
from flask import Flask, request, render_template, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image
import io

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def compress_pdf(input_path, output_path, dpi=300, quality=5, target_reduction=50, target_size=None):
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()

        # Convert quality scale (1-10) to a decimal (0.1-1.0)
        image_quality = quality / 10.0
        original_size = os.path.getsize(input_path)

        # Calculate target size based on input parameters
        if target_size:
            # Convert KB to bytes
            target_bytes = target_size * 1024
            target_reduction = ((original_size - target_bytes) / original_size) * 100
            logger.debug(f"Target size specified: {target_size}KB ({target_bytes} bytes)")
        else:
            target_bytes = original_size * (1 - (target_reduction / 100))

        logger.debug(f"Compression parameters: DPI={dpi}, Quality={quality}, Target Reduction={target_reduction}%")
        logger.debug(f"Original size: {original_size}, Target size: {target_bytes} bytes")

        # Process each page
        for page_num, page in enumerate(reader.pages):
            logger.debug(f"Processing page {page_num + 1}")
            
            # Copy page
            writer.add_page(page)
            
            # Process images in the page
            if '/Resources' in page and '/XObject' in page['/Resources']:
                xObject = page['/Resources']['/XObject'].get_object()
                
                for obj in xObject:
                    if xObject[obj]['/Subtype'] == '/Image':
                        img_object = xObject[obj]
                        
                        # Set image compression parameters
                        if img_object['/Filter'] in ['/FlateDecode', '/DCTDecode', '/JPXDecode']:
                            img_object.update({
                                '/Quality': int(image_quality * 100),
                                '/ColorTransform': 1,
                                '/Interpolate': True
                            })

        # Apply compression settings
        writer._compress = True
        writer._image_quality = image_quality

        # Write compressed PDF
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

        # Verify results
        compressed_size = os.path.getsize(output_path)
        reduction_achieved = ((original_size - compressed_size) / original_size) * 100
        
        logger.debug(f"Compression complete. Original: {original_size}, Compressed: {compressed_size}, Reduction: {reduction_achieved:.1f}%")
        
        return compressed_size

    except Exception as e:
        logger.error(f"Error during PDF compression: {str(e)}")
        raise

@app.route('/')
def index():
    return render_template('pdfcompress.html')

@app.route('/compress', methods=['POST'])
def compress():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not file or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        # Get compression parameters
        dpi = int(request.form.get('dpi', 300))
        quality = int(request.form.get('quality', 5))
        target_reduction = int(request.form.get('target_reduction', 50))
        target_size = request.form.get('target_size')
        
        if target_size:
            try:
                target_size = float(target_size)
            except ValueError:
                return jsonify({'error': 'Invalid target size value'}), 400

        # Save original file
        original_filename = secure_filename(file.filename)
        original_path = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
        file.save(original_path)

        # Create compressed file
        compressed_path = os.path.join(app.config['UPLOAD_FOLDER'], f"compressed_{original_filename}")
        
        # Get original size
        original_size = os.path.getsize(original_path)
        
        # Compress PDF
        compressed_size = compress_pdf(
            original_path, 
            compressed_path, 
            dpi, 
            quality, 
            target_reduction,
            target_size
        )

        # Clean up original file
        os.remove(original_path)

        # Calculate reduction percentage
        reduction = ((original_size - compressed_size) / original_size) * 100

        return jsonify({
            'filename': f"compressed_{original_filename}",
            'original_size': original_size,
            'compressed_size': compressed_size,
            'reduction': reduction
        })

    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

# Export the app for Vercel
def handler(event, context):
    return app(event, context)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
