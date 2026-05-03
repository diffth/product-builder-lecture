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
const resultDetails = {
    "강아지": {
        "comment": "다정다감하고 사교적인 당신은 누구에게나 사랑받는 강아지상!",
        "personality": "친절하고 활발한 성격으로 주변 사람들에게 긍정적인 에너지를 줍니다. 때로는 애교 넘치는 모습으로 분위기 메이커 역할을 하기도 하네요.",
        "features": "선하고 동글동글한 눈매, 부드러운 인상이 특징입니다."
    },
    "고양이": {
        "comment": "신비롭고 도도한 매력의 소유자, 당신은 완벽한 고양이상!",
        "personality": "처음에는 조금 내성적일 수 있지만, 알면 알수록 깊은 매력을 가진 타입입니다. 독립심이 강하고 자기 주관이 뚜렷하며 센스 있는 감각을 가졌네요.",
        "features": "눈꼬리가 살짝 올라간 매혹적인 눈매와 날카로운듯 세련된 턱선이 특징입니다."
    }
};

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

    // Update detailed commentary
    const resultExplain = document.getElementById('result-explain');
    const className = topResult.className.trim();
    
    // Find matching details (robust matching)
    let details = resultDetails[className];
    if (!details) {
        // If exact match fails, try partial match (e.g. "강아지상" vs "강아지")
        for (const key in resultDetails) {
            if (className.includes(key) || key.includes(className)) {
                details = resultDetails[key];
                break;
            }
        }
    }

    if (details) {
        resultExplain.innerHTML = `
            <p class="result-comment">"${details.comment}"</p>
            <div class="detail-box">
                <strong>성격:</strong> <span>${details.personality}</span>
            </div>
            <div class="detail-box">
                <strong>특징:</strong> <span>${details.features}</span>
            </div>
        `;
        resultExplain.style.display = 'block';
    } else {
        // Fallback message if no detailed match found
        resultExplain.innerHTML = `<p class="result-comment">당신은 매력적인 ${className}상을 가졌군요!</p>`;
        resultExplain.style.display = 'block';
    }

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
