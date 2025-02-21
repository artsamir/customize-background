document.getElementById('uploadImage').addEventListener('change', function (event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (e) {
        let img = new Image();
        img.onload = function () {
            let canvas = document.getElementById('canvas');
            let ctx = canvas.getContext('2d');

            // Resize canvas to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, img.width, img.height);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let imgData;

function applyFilter(filter) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        if (filter === 'grayscale') {
            let avg = (r + g + b) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        } else if (filter === 'sepia') {
            data[i] = r * 0.393 + g * 0.769 + b * 0.189;
            data[i + 1] = r * 0.349 + g * 0.686 + b * 0.168;
            data[i + 2] = r * 0.272 + g * 0.534 + b * 0.131;
        } else if (filter === 'invert') {
            data[i] = 255 - r;
            data[i + 1] = 255 - g;
            data[i + 2] = 255 - b;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Brightness, Contrast & Saturation Controls
document.getElementById('brightness').addEventListener('input', updateFilters);
document.getElementById('contrast').addEventListener('input', updateFilters);
document.getElementById('saturation').addEventListener('input', updateFilters);

function updateFilters() {
    let brightness = parseInt(document.getElementById('brightness').value);
    let contrast = parseInt(document.getElementById('contrast').value);
    let saturation = parseInt(document.getElementById('saturation').value);

    let filterString = `brightness(${brightness + 100}%) contrast(${contrast + 100}%) saturate(${saturation + 100}%)`;
    canvas.style.filter = filterString;
}

// Add Text Function
function addText() {
    let text = prompt("Enter text:");
    if (text) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(text, 50, 50);
    }
}

// Enable Drawing
function enableDrawing() {
    let drawing = false;
    canvas.onmousedown = () => drawing = true;
    canvas.onmouseup = () => drawing = false;
    canvas.onmousemove = function (e) {
        if (!drawing) return;
        ctx.fillStyle = "black";
        ctx.fillRect(e.offsetX, e.offsetY, 5, 5);
    };
}

// Save Edited Image
function saveImage() {
    let link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
}
