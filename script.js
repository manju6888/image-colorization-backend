const API_URL = 'http://localhost:5000/api';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const colorizeBtn = document.getElementById('colorizeBtn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const originalImg = document.getElementById('originalImg');
const colorizedImg = document.getElementById('colorizedImg');
const downloadBtn = document.getElementById('downloadBtn');
const newBtn = document.getElementById('newBtn');

let selectedFile = null;
let colorizedData = null;

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('active');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select an image!');
        return;
    }
    selectedFile = file;
    colorizeBtn.disabled = false;
    dropZone.innerHTML = `
        <i class="fas fa-check-circle" style="color:#48bb78"></i>
        <h3>Selected: ${file.name}</h3>
        <p>Click Colorize to continue</p>
    `;
}

colorizeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    loading.style.display = 'block';
    results.style.display = 'none';
    colorizeBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('image', selectedFile);

        const response = await fetch(`${API_URL}/colorize`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            originalImg.src = `data:image/jpeg;base64,${data.original}`;
            colorizedImg.src = `data:image/jpeg;base64,${data.colorized}`;
            colorizedData = data.colorized;
            results.style.display = 'block';
            results.scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Cannot connect to server. Is backend running?');
    } finally {
        loading.style.display = 'none';
        colorizeBtn.disabled = false;
    }
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${colorizedData}`;
    link.download = 'colorized.jpg';
    link.click();
});

newBtn.addEventListener('click', () => {
    selectedFile = null;
    colorizedData = null;
    fileInput.value = '';
    results.style.display = 'none';
    colorizeBtn.disabled = true;
    dropZone.innerHTML = `
        <i class="fas fa-cloud-upload-alt"></i>
        <h3>Drag & Drop or Click</h3>
        <p>PNG, JPG, JPEG supported</p>
    `;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});