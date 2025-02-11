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

// file-uploader, preview-box, upload-image-icon, upload-icon, 
// processingAnimation, removeButton

document.addEventListener("DOMContentLoaded", function () {
    const fileUploader = document.querySelector(".file-uploader");
    const previewBox = document.querySelector(".preview-box");
    const removeButton = document.getElementById("removeButton");
    const downloadButton = document.getElementById("downloadButton");
    const processingAnimation = document.getElementById("processingAnimation");
    const previewContainer = document.getElementById("preview-container"); 
    const previewBoxes = document.querySelectorAll("#preview-container .passportViewBox");
    const colorPicker = document.getElementById("colorPicker"); // Color Picker Input

    let selectedFile = null;
    let removedBgImageURL = ""; 

    // Predefined color shades for different colors
    const colorShades = {
        red: ["#ff9999", "#cc0000", "#ff4d4d", "#ff3333", "#990000", "#ff6666", "#e60000", "#ff1a1a", "#b30000", "#ffb3b3"],
        green: ["#99ff99", "#008000", "#66ff66", "#339933", "#00cc00", "#33cc33", "#00b300", "#009900", "#4dff4d", "#80ff80"],
        blue: ["#99ccff", "#0000cc", "#3399ff", "#003366", "#0066cc", "#1a75ff", "#004d99", "#6699ff", "#0080ff", "#4da6ff"],
        yellow: ["#ffff99", "#cccc00", "#ffff66", "#999900", "#ffcc00", "#ffdb4d", "#ffcc33", "#ffb84d", "#e6b800", "#ffd633"],
        purple: ["#d9b3ff", "#800080", "#b366ff", "#9933cc", "#660066", "#a64dff", "#9933ff", "#bf40bf", "#cc33cc", "#e066ff"],
        orange: ["#ffcc99", "#ff6600", "#ff8533", "#cc5200", "#ff944d", "#ff7f24", "#e67300", "#ff9900", "#ff9966", "#ffb366"]
    };

    // Function to get the nearest color category
    function getClosestColor(hex) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);

        if (r > g && r > b) return "red";
        if (g > r && g > b) return "green";
        if (b > r && b > g) return "blue";
        if (r > 200 && g > 200 && b < 100) return "yellow";
        if (r > 150 && b > 150 && g < 100) return "purple";
        if (r > 200 && g > 100 && b < 50) return "orange";
        return "blue"; // Default fallback
    }

    // File upload event
    fileUploader.addEventListener("change", function (event) {
        selectedFile = event.target.files[0];

        if (selectedFile) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewBox.innerHTML = "";
                let img = document.createElement("img");
                img.src = e.target.result;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                previewBox.appendChild(img);
            };

            reader.readAsDataURL(selectedFile);
        }
    });

    // Remove background button event
    removeButton.addEventListener("click", async function () {
        if (!selectedFile) {
            alert("Please select an image first.");
            return;
        }

        processingAnimation.style.display = "flex"; // Show loader

        const formData = new FormData();
        formData.append("image_file", selectedFile);
        formData.append("size", "auto");

        try {
            const response = await fetch("https://api.remove.bg/v1.0/removebg", {
                method: "POST",
                headers: {
                    "X-Api-Key": "yKRweTx9nvHsW9B6kHpz33KC"
                },
                body: formData
            });

            if (!response.ok) throw new Error("Failed to remove background");

            const blob = await response.blob();
            removedBgImageURL = URL.createObjectURL(blob);

            setTimeout(() => {
                previewBox.innerHTML = "";
                let img = document.createElement("img");
                img.src = removedBgImageURL;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                previewBox.appendChild(img);

                // ✅ Apply different shades based on color selection
                applyColorVariation(colorPicker.value);

                processingAnimation.style.display = "none"; 
            }, 2000);

        } catch (error) {
            console.error("Error:", error);
            alert("Failed to remove background. Try again.");
        }
    });

    // Download button event
    downloadButton.addEventListener("click", function () {
        if (!removedBgImageURL) {
            alert("No processed image available. Please remove background first.");
            return;
        }

        const link = document.createElement("a");
        link.href = removedBgImageURL;
        link.download = "removed-background.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Apply color variations based on user selection
    function applyColorVariation(selectedColor) {
        let baseColor = getClosestColor(selectedColor);
        let shades = colorShades[baseColor];

        previewBoxes.forEach((box, index) => {
            box.style.backgroundColor = shades[index % shades.length]; // Assign shade
            box.style.display = "block"; // Make box visible
            box.innerHTML = ""; 
            
            let imgClone = document.createElement("img");
            imgClone.src = removedBgImageURL;
            imgClone.style.width = "100%";
            imgClone.style.height = "103%";
            imgClone.style.marginTop = "13px";
            imgClone.style.objectFit = "cover";
            box.appendChild(imgClone);
        });

        previewContainer.style.display = "grid"; // Show preview container
    }

    // Apply color shades when user selects a new color
    colorPicker.addEventListener("input", function () {
        applyColorVariation(this.value);
    });
});
