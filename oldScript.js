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
    const downloadButton = document.getElementById("downloadButton"); // Select Download Button
    const processingAnimation = document.getElementById("processingAnimation");
    const previewBoxes = document.querySelectorAll("#preview-container .preview-box");

    let selectedFile = null;
    let removedBgImageURL = ""; // Store the processed image URL

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
                    "X-Api-Key": "GkLDB4hAfmEMgfadDZNdFNgr"
                },
                body: formData
            });

            if (!response.ok) throw new Error("Failed to remove background");

            const blob = await response.blob();
            removedBgImageURL = URL.createObjectURL(blob); //  Save for download

            setTimeout(() => {
                previewBox.innerHTML = "";
                let img = document.createElement("img");
                img.src = removedBgImageURL;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                previewBox.appendChild(img);

                processingAnimation.style.display = "none"; // Hide loader
            }, 2000);

        } catch (error) {
            console.error("Error:", error);
            alert("Failed to remove background. Try again.");
        }
    });

    // Download Button Logic
    downloadButton.addEventListener("click", function () {
        if (!removedBgImageURL) {
            alert("No processed image available. Please remove background first.");
            return;
        }

        const link = document.createElement("a");
        link.href = removedBgImageURL;
        link.download = "removed-background.png"; // Save as PNG
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});


