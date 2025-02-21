function toggleMenu() {
    const navLinks = document.querySelector(".nav-links");
    const menuIcon = document.querySelector(".menu-icon i");

    navLinks.classList.toggle("active");

    if (navLinks.classList.contains("active")) {
        menuIcon.classList.remove("fa-bars");
        menuIcon.classList.add("fa-times");
    } else {
        menuIcon.classList.remove("fa-times");
        menuIcon.classList.add("fa-bars");
    }
}

document.getElementById('uploadImage').addEventListener('change', function (event) {
    let file = event.target.files[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = function (e) {
        let img = new Image();
        img.onload = function () {
            let canvas = document.getElementById('canvas');
            let ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

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

document.getElementById('brightness').addEventListener('input', updateFilters);
document.getElementById('contrast').addEventListener('input', updateFilters);
document.getElementById('saturation').addEventListener('input', updateFilters);
document.getElementById('temperature').addEventListener('input', updateFilters);
document.getElementById('tint').addEventListener('input', updateFilters);
document.getElementById('highlights').addEventListener('input', updateFilters);
document.getElementById('shadows').addEventListener('input', updateFilters);
document.getElementById('whites').addEventListener('input', updateFilters);
document.getElementById('blacks').addEventListener('input', updateFilters);
document.getElementById('vibrance').addEventListener('input', updateFilters);

function updateFilters() {
    let brightness = parseInt(document.getElementById('brightness').value);
    let contrast = parseInt(document.getElementById('contrast').value);
    let saturation = parseInt(document.getElementById('saturation').value);
    let temperature = parseInt(document.getElementById('temperature').value);
    let tint = parseInt(document.getElementById('tint').value);
    let highlights = parseInt(document.getElementById('highlights').value);
    let shadows = parseInt(document.getElementById('shadows').value);
    let whites = parseInt(document.getElementById('whites').value);
    let blacks = parseInt(document.getElementById('blacks').value);
    let vibrance = parseInt(document.getElementById('vibrance').value);

    let filterString = `brightness(${brightness + 100}%) contrast(${contrast + 100}%) saturate(${saturation + 100}%) 
                        hue-rotate(${temperature}deg) sepia(${tint}%) 
                        brightness(${highlights + 100}%) contrast(${shadows + 100}%) 
                        brightness(${whites + 100}%) contrast(${blacks + 100}%) 
                        saturate(${vibrance + 100}%)`;
    canvas.style.filter = filterString;
}

function addText() {
    let text = prompt("Enter text:");
    if (text) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(text, 50, 50);
    }
}

let drawing = false;
let erasing = false;

function enableDrawing() {
    drawing = true;
    erasing = false;
    canvas.onmousedown = () => drawing = true;
    canvas.onmouseup = () => drawing = false;
    canvas.onmousemove = function (e) {
        if (!drawing) return;
        ctx.fillStyle = document.getElementById('penColor').value;
        ctx.fillRect(e.offsetX, e.offsetY, document.getElementById('penSize').value, document.getElementById('penSize').value);
    };
}

function enableEraser() {
    erasing = true;
    drawing = false;
    canvas.onmousedown = () => erasing = true;
    canvas.onmouseup = () => erasing = false;
    canvas.onmousemove = function (e) {
        if (!erasing) return;
        ctx.clearRect(e.offsetX, e.offsetY, document.getElementById('penSize').value, document.getElementById('penSize').value);
    };
}

function addShape(shape) {
    let fillColor = document.getElementById('shapeFillColor').value;
    let borderColor = document.getElementById('shapeBorderColor').value;

    if (shape === 'rectangle') {
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.fillRect(50, 50, 100, 100);
        ctx.strokeRect(50, 50, 100, 100);
    } else if (shape === 'circle') {
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.beginPath();
        ctx.arc(100, 100, 50, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function saveImage() {
    let link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
}