// Zainpreneur Agency - Main application script
document.addEventListener('DOMContentLoaded', function() {
    // Initialize upload area functionality
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            // Trigger change event to process files
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            console.log('Files selected:', this.files.length);
            // TODO: Implement file processing
        }
    });

    // Camera section toggle
    const openCameraBtn = document.getElementById('openCameraBtn');
    const cameraSection = document.getElementById('cameraSection');
    
    if (openCameraBtn && cameraSection) {
        openCameraBtn.addEventListener('click', function() {
            cameraSection.style.display = 'block';
        });
    }

    // HTR interface elements
    const originalImg = document.getElementById('originalImg');
    const verifiedText = document.getElementById('verifiedText');
    
    if (originalImg) {
        originalImg.addEventListener('click', function() {
            console.log('Image clicked');
        });
    }
});