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

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('uploadForm');
    const imageInput = document.getElementById('image');
    const previewContainer = document.getElementById('preview-container');
    const preview = document.getElementById('preview');
    const imageInfo = document.getElementById('imageInfo');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = submitBtn.querySelector('.spinner-border');

    function showToast(message, isError = false) {
        const toastContainer = document.getElementById('toastContainer');
        const toastElement = document.createElement('div');
        toastElement.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
        toastElement.setAttribute('role', 'alert');
        toastElement.setAttribute('aria-live', 'assertive');
        toastElement.setAttribute('aria-atomic', 'true');
        
        toastElement.innerHTML = `
            <div class="toast-header ${isError ? 'bg-danger' : 'bg-success'} text-white">
                <strong class="me-auto">${isError ? 'Error' : 'Success'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        toastContainer.appendChild(toastElement);
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.match('image.*')) {
                showToast('Please select an image file', true);
                imageInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                previewContainer.classList.remove('d-none');
                
                // Display image information
                const img = new Image();
                img.onload = function() {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    imageInfo.textContent = `Original Size: ${sizeMB} MB | Dimensions: ${this.width}x${this.height}px`;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            const response = await fetch('/resize', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to resize image');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'resized_image.jpg';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast('Image resized successfully!');
        } catch (error) {
            showToast(error.message, true);
        } finally {
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    });
});