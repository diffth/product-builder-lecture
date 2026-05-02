function getBallColorClass(num) {
    if (num <= 10) return 'ball-1';
    if (num <= 20) return 'ball-11';
    if (num <= 30) return 'ball-21';
    if (num <= 40) return 'ball-31';
    return 'ball-41';
}

async function generateLotto() {
    const container = document.getElementById('balls-container');
    const button = document.querySelector('button');
    
    // 초기화
    container.innerHTML = '';
    button.disabled = true;
    button.innerText = '추첨 중...';

    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }

    // 오름차순 정렬
    numbers.sort((a, b) => a - b);

    // 애니메이션과 함께 공 표시
    for (let i = 0; i < numbers.length; i++) {
        const ball = document.createElement('div');
        ball.className = `ball ${getBallColorClass(numbers[i])}`;
        ball.innerText = numbers[i];
        container.appendChild(ball);
        
        // 약간의 시차를 두고 애니메이션 실행
        await new Promise(resolve => setTimeout(resolve, 200));
        ball.classList.add('show');
    }

    button.disabled = false;
    button.innerText = '다시 추첨하기';
}
