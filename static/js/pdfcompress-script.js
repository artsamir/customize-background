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

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const compressBtn = document.getElementById('compressBtn');
    const progressArea = document.getElementById('progressArea');
    const resultArea = document.getElementById('resultArea');
    const errorArea = document.getElementById('errorArea');
    const errorMessage = document.getElementById('errorMessage');
    const downloadBtn = document.getElementById('downloadBtn');

    const qualityValue = document.getElementById('qualityValue');
    const dpiValue = document.getElementById('dpiValue');
    const percentageValue = document.getElementById('percentageValue');

    const imageQuality = document.getElementById('imageQuality');
    const imageResolution = document.getElementById('imageResolution');
    const compressionPercentage = document.getElementById('compressionPercentage');

    // Update slider values
    imageQuality.addEventListener('input', () => {
        qualityValue.textContent = imageQuality.value;
    });

    imageResolution.addEventListener('input', () => {
        dpiValue.textContent = imageResolution.value;
    });

    compressionPercentage.addEventListener('input', () => {
        percentageValue.textContent = `${compressionPercentage.value}%`;
    });

    // Handle form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!fileInput.files.length) {
            showError('Please select a PDF file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('quality', imageQuality.value);
        formData.append('dpi', imageResolution.value);
        formData.append('target_reduction', compressionPercentage.value);

        progressArea.style.display = 'block';
        resultArea.style.display = 'none';
        errorArea.style.display = 'none';

        try {
            const response = await fetch('/compress', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error compressing PDF');
            }

            document.getElementById('originalSize').textContent = formatBytes(data.original_size);
            document.getElementById('compressedSize').textContent = formatBytes(data.compressed_size);
            document.getElementById('reduction').textContent = `${data.reduction.toFixed(1)}%`;

            downloadBtn.onclick = () => {
                window.location.href = `/download/${data.filename}`;
            };

            progressArea.style.display = 'none';
            resultArea.style.display = 'block';
        } catch (error) {
            showError(error.message);
        }
    });

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorArea.style.display = 'block';
        progressArea.style.display = 'none';
        resultArea.style.display = 'none';
    }
});