function toggleMenu() {
    const navLinks = document.querySelector(".nav-links");
    const menuIcon = document.querySelector(".menu-icon i");

    navLinks.classList.toggle("active");

    // Change icon based on active state
    if (navLinks.classList.contains("active")) {
        menuIcon.classList.remove("fa-bars"); // Remove hamburger icon
        menuIcon.classList.add("fa-times"); // Add close icon
    } else {
        menuIcon.classList.remove("fa-times"); // Remove close icon
        menuIcon.classList.add("fa-bars"); // Add hamburger icon
    }
}

const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const convertButton = document.getElementById('convert-button');
const downloadLink = document.getElementById('download-link');
const filenameDisplay = document.getElementById('filename-display');
const uploadPreview = document.getElementById('upload-preview');
const convertedPreview = document.getElementById('converted-preview');
const conversionTypeDisplay = document.getElementById('conversion-type-display');
const previewContainer = document.querySelector(".preview-container");
const conversionOptions = document.getElementById("conversion-options");
const convertButtonElement = document.getElementById("convert-button");

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('active');
}

function unhighlight(e) {
    dropArea.classList.remove('active');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

dropArea.addEventListener('click', function() {
    fileInput.click();
});

function handleFiles(files) {
    const file = files[0];
    if (file && file.type === 'image/webp') {
        const reader = new FileReader();
        reader.onload = function(event) {
            convertButton.onclick = function() {
                convertWebp(event.target.result, file.name);
            };
            uploadPreview.src = event.target.result;
            uploadPreview.style.display = 'block';
            filenameDisplay.textContent = file.name;
            convertedPreview.style.display = 'none';
            conversionTypeDisplay.style.display = 'none';
            previewContainer.style.display = "flex";
            conversionOptions.style.display = "block";
            convertButtonElement.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please select a WebP image.');
    }
}

function convertWebp(dataUrl, fileName) {
    const canvas = document.createElement('canvas');
    const img = new Image();

    img.onload = function() {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const format = document.querySelector('input[name="format"]:checked').value;
        const newDataUrl = canvas.toDataURL(`image/${format}`);

        convertedPreview.src = newDataUrl;
        convertedPreview.style.display = 'block';

        downloadLink.href = newDataUrl;
        downloadLink.download = fileName.replace('.webp', `.${format}`);
        downloadLink.style.display = 'block';

        conversionTypeDisplay.textContent = `Converted to ${format.toUpperCase()}`;
        conversionTypeDisplay.style.display = 'block';
    };
    img.src = dataUrl;
}