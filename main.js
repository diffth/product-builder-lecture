const URL = "https://teachablemachine.withgoogle.com/models/WuXa3kLZw/";

let model, webcam, maxPredictions;
let isWebcamStarted = false;

// Load the image model
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Model loaded successfully");
    } catch (error) {
        console.error("Error loading model:", error);
    }
}

// Call init on load
init();

// Mode Selection
const uploadBtn = document.getElementById('upload-mode-btn');
const webcamBtn = document.getElementById('webcam-mode-btn');
const uploadContainer = document.getElementById('upload-container');
const webcamContainer = document.getElementById('webcam-container');
const resultSection = document.getElementById('result-section');

uploadBtn.addEventListener('click', () => {
    switchMode('upload');
});

webcamBtn.addEventListener('click', () => {
    switchMode('webcam');
});

function switchMode(mode) {
    if (mode === 'upload') {
        uploadBtn.classList.add('active');
        webcamBtn.classList.remove('active');
        uploadContainer.style.display = 'block';
        webcamContainer.style.display = 'none';
        stopWebcam();
    } else {
        webcamBtn.classList.add('active');
        uploadBtn.classList.remove('active');
        webcamContainer.style.display = 'block';
        uploadContainer.style.display = 'none';
    }
    resultSection.style.display = 'none';
}

// Photo Upload Logic
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            const dropZone = document.getElementById('drop-zone');
            const previewContainer = document.getElementById('image-preview-container');
            const faceImage = document.getElementById('face-image');

            dropZone.style.display = 'none';
            faceImage.src = e.target.result;
            previewContainer.style.display = 'block';

            // Show results area and loading
            resultSection.style.display = 'block';
            document.getElementById('loading').style.display = 'block';
            document.getElementById('prediction-results').style.display = 'none';

            // Predict after a short delay to allow image to load
            setTimeout(predictUpload, 500);
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        removeUpload();
    }
}

function removeUpload() {
    document.getElementById('file-input').value = "";
    document.getElementById('image-preview-container').style.display = 'none';
    document.getElementById('drop-zone').style.display = 'block';
    resultSection.style.display = 'none';
}

async function predictUpload() {
    if (!model) return;
    const image = document.getElementById('face-image');
    const prediction = await model.predict(image);
    displayResults(prediction);
}

// Webcam Logic
const startWebcamBtn = document.getElementById('start-webcam-btn');
startWebcamBtn.addEventListener('click', async () => {
    if (isWebcamStarted) return;
    
    startWebcamBtn.innerText = "웹캠 준비 중...";
    const flip = true;
    webcam = new tmImage.Webcam(300, 300, flip);
    
    try {
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);
        
        document.getElementById('webcam-feed').appendChild(webcam.canvas);
        startWebcamBtn.style.display = 'none';
        isWebcamStarted = true;
        
        resultSection.style.display = 'block';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('prediction-results').style.display = 'block';
    } catch (error) {
        console.error("Webcam error:", error);
        alert("웹캠을 시작할 수 없습니다. 권한을 확인해주세요.");
        startWebcamBtn.innerText = "웹캠 시작하기";
    }
});

async function loop() {
    if (!isWebcamStarted) return;
    webcam.update();
    await predictWebcam();
    window.requestAnimationFrame(loop);
}

async function predictWebcam() {
    if (!model || !webcam) return;
    const prediction = await model.predict(webcam.canvas);
    displayResults(prediction, true);
}

function stopWebcam() {
    if (webcam) {
        webcam.stop();
        const feed = document.getElementById('webcam-feed');
        if (feed.firstChild) feed.removeChild(feed.firstChild);
        startWebcamBtn.style.display = 'inline-block';
        startWebcamBtn.innerText = "웹캠 시작하기";
        isWebcamStarted = false;
    }
}

// Display Results
function displayResults(prediction, isLive = false) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('prediction-results').style.display = 'block';

    const labelContainer = document.getElementById('label-container');
    
    // Sort prediction to find the best match
    prediction.sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability));
    
    const topResult = prediction[0];
    const resultMessage = document.getElementById('result-message');
    
    // Custom messages based on animal
    let emoji = "";
    if (topResult.className === "강아지") emoji = "🐶";
    else if (topResult.className === "고양이") emoji = "🐱";
    
    resultMessage.innerText = `${emoji} 당신은 ${topResult.className}상 입니다!`;

    // Clear previous bars if not live or if it's the first time
    if (!isLive || labelContainer.childNodes.length === 0) {
        labelContainer.innerHTML = "";
        for (let i = 0; i < maxPredictions; i++) {
            const barContainer = document.createElement("div");
            barContainer.className = "animal-bar-container";
            
            const label = document.createElement("div");
            label.className = "animal-label";
            label.innerHTML = `<span>${prediction[i].className}</span><span id="prob-${i}">0%</span>`;
            
            const barBg = document.createElement("div");
            barBg.className = "bar-bg";
            
            const barFill = document.createElement("div");
            barFill.className = "bar-fill";
            barFill.id = `bar-${i}`;
            barFill.style.width = "0%";
            
            barBg.appendChild(barFill);
            barContainer.appendChild(label);
            barContainer.appendChild(barBg);
            labelContainer.appendChild(barContainer);
        }
    }

    // Update bar values
    for (let i = 0; i < maxPredictions; i++) {
        const prob = (prediction[i].probability * 100).toFixed(0);
        const barFill = document.getElementById(`bar-${i}`);
        const probText = document.getElementById(`prob-${i}`);
        
        if (barFill && probText) {
            barFill.style.width = prob + "%";
            probText.innerText = prob + "%";
        }
    }
}
