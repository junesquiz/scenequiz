(function(){

  function sanitizeName(name) {
    return name.replace(/«/g, '&laquo;')
               .replace(/»/g, '&raquo;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#39;');
  }

  function unsanitizeName(name) {
    return name.replace(/&laquo;/g, '«')
               .replace(/&raquo;/g, '»')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
  }
  const testContainer = document.createElement('div');
  testContainer.id = 'test-container';
  testContainer.innerHTML = `
    <h2 style="font-size: 16px; margin:5px 0; font-weight:normal;">Викторина</h2>
    <div id="difficulty-select" style="margin-bottom:5px;">
      <span>Выберите сложность: </span>
      <button onclick="startTestByStar(1)">1 звезда</button>
      <button onclick="startTestByStar(2)">2 звезды</button>
      <button onclick="startTestByStar(3)">3 звезды</button>
      <button onclick="startTestByStar(4)">4 звезды</button>
      <button onclick="startTestByStar(5)">5 звёзд</button>
      <button onclick="startTestByStar('all')">Все объекты</button>
    </div>
    <div id="test-question"></div>
    <div id="test-feedback"></div>
    <div id="test-stats">Счёт: 0 | Попыток: 0</div>
    <img id="test-image" src="" style="display: none;">
    <div id="highlight-box" style="
      position: absolute; display: none; border: 3px solid #0066FF; 
      box-sizing: border-box; pointer-events: none; z-index: 2;
      background: transparent;
    "></div>
    <button id="restart-button" style="display:none;" onclick="restartTest()">Пройти ещё раз</button>
  `;
  

  const style = document.createElement('style');
  style.textContent = `
    #test-container {
      margin: 5px auto;
      padding: 5px;
      border: 2px solid #ccc;
      border-radius: 5px;
      max-width: 1400px;
      text-align: center;
      background: #f9f9f9;
    }
    #test-question {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }
    #test-feedback {
      font-size: 16px;
      font-weight: bold;
      margin: 5px 0;
      min-height: 10px;
    }
    #difficulty-select button {
      padding: 5px 5px;
      font-size: 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 5px;
    }
    #difficulty-select button:hover {
      background-color: #45a049;
    }
    #test-image {
      max-width: 100%;
      max-height: 90vh;
      width: 100%;
      height: auto;
      margin: 10px 0;
      cursor: crosshair;
      border: 1px solid #ddd;
      object-fit: contain;
    }
    .correct { color: green; }
    .incorrect { color: red; }
    #test-stats {
      margin-top: 5px;
      font-size: 16px;
    }
    #restart-button {
      padding: 5px 5px;
      font-size: 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 5px;
    }
    #restart-button:hover {
      background-color: #45a049;
    }
  `;
  

  document.head.appendChild(style);
  document.body.insertBefore(testContainer, document.body.firstChild);
  

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  let currentItem = null;
  let testStarted = false;
  let score = 0;
  let attempts = 0;
  let scaleFactor = 1;
  let originalWidth = 1369;
  let originalHeight = 768;
  let shuffledItems = [];
  let currentIndex = 0;
  let selectedItems = [];

  window.startTestByStar = function(star) {
    document.getElementById('difficulty-select').style.display = 'none';
    if (star == 'all') {
      selectedItems = [].concat(...items).map(item => [
        item[0], 
        unsanitizeName(item[1]), 
        ...item.slice(2)
      ]);
    } else {
      const starDiv = document.getElementById(`${star}-star`);
      let displayNames = [];
      if (starDiv) {
        let ths = starDiv.querySelectorAll('th, td');
        ths.forEach((th, idx) => {
          if (idx === 0) return;
          let parts = th.innerHTML.split('<br>');
          if (parts.length >= 3) {
            let displayName = parts[2].replace(/<[^>]+>/g, '').trim();
            if (displayName) displayNames.push(sanitizeName(displayName));
          }
        });
      }
      selectedItems = [].concat(...items).filter(item =>
        displayNames.includes(sanitizeName(item[1])) 
      ).map(item => [
        item[0], 
        unsanitizeName(item[1]),
        ...item.slice(2)
      ]);

      console.log(`Выбран уровень сложности: ${star} звезд`);
      console.log('Имена для поиска:', displayNames);
      console.log('Найденные объекты:', selectedItems.map(item => item[1]));
    }
    startTest();
  };

  window.startTest = function() {
    if (!testStarted) {
      testStarted = true;
      document.getElementById('restart-button').style.display = 'none';
      score = 0;
      attempts = 0;
      updateStats();

      const testImage = document.getElementById('test-image');
      testImage.src = document.getElementById('scenePicture').src;
      testImage.style.display = 'block';
      shuffledItems = shuffle(selectedItems.slice());
      currentIndex = 0;
      hideHighlight();
      testImage.onload = function() {
        const displayedWidth = testImage.naturalWidth;
        const displayedHeight = testImage.naturalHeight;
        scaleFactor = Math.min(
          displayedWidth / originalWidth,
          displayedHeight / originalHeight
        );
        nextQuestion();
      };
    }
  };

  window.restartTest = function() {
    testStarted = false;
    document.getElementById('difficulty-select').style.display = 'block';
    document.getElementById('restart-button').style.display = 'none';
    document.getElementById('test-image').style.display = 'none';
    document.getElementById('test-question').textContent = '';
    document.getElementById('test-feedback').textContent = '';
    document.getElementById('test-feedback').className = '';
    score = 0;
    attempts = 0;
    updateStats();
    hideHighlight();
  };

  function nextQuestion() {
    hideHighlight();
    if (currentIndex >= shuffledItems.length) {
      document.getElementById('test-question').textContent = 'Отлично! Вы прошли все объекты';
      currentItem = null;
      document.getElementById('restart-button').style.display = 'inline-block';
      return;
    }
    currentItem = shuffledItems[currentIndex];
    currentIndex++;
    document.getElementById('test-question').textContent = `Найдите: ${currentItem[1]}`;
    if (document.getElementById('test-feedback').textContent === 'Неправильно') {
      document.getElementById('test-feedback').textContent = '';
      document.getElementById('test-feedback').className = '';
    }
  }

  function updateStats() {
    document.getElementById('test-stats').textContent = `Счёт: ${score} | Попыток: ${attempts}`;
  }

  function showHighlight(minX, minY, maxX, maxY) {
    const img = document.getElementById('test-image');
    const rect = img.getBoundingClientRect();
    const highlight = document.getElementById('highlight-box');
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const dispWidth = rect.width;
    const dispHeight = rect.height;
    const imgAspect = imgWidth / imgHeight;
    const elAspect = dispWidth / dispHeight;
    let scale, offsetX = 0, offsetY = 0;

    if (elAspect > imgAspect) {
      scale = dispHeight / imgHeight;
      offsetX = (dispWidth - imgWidth * scale) / 2;
      offsetY = 0;
    } else {
      scale = dispWidth / imgWidth;
      offsetX = 0;
      offsetY = (dispHeight - imgHeight * scale) / 2;
    }

    const left = Math.round(rect.left + window.scrollX + minX * scale + offsetX);
    const top = Math.round(rect.top + window.scrollY + minY * scale + offsetY);

    const width = Math.round((maxX - minX) * scale);
    const height = Math.round((maxY - minY) * scale);

    highlight.style.display = 'block';
    highlight.style.left = left + 'px';
    highlight.style.top = top + 'px';
    highlight.style.width = width + 'px';
    highlight.style.height = height + 'px';
    highlight.style.border = '8px solid blue';
    highlight.style.background = 'transparent';
    highlight.style.position = 'absolute';
    highlight.style.pointerEvents = 'none';
    highlight.style.zIndex = 2;
  }

  function hideHighlight() {
    const highlight = document.getElementById('highlight-box');
    highlight.style.display = 'none';
  }

  document.getElementById('test-image').addEventListener('click', function(e) {
    if (!testStarted || !currentItem) return;
    hideHighlight();
    const rect = this.getBoundingClientRect();
    const img = this;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const imgAspect = imgWidth / imgHeight;
    const elAspect = rect.width / rect.height;
    let clickX, clickY;
    if (elAspect > imgAspect) {
      const scale = rect.height / imgHeight;
      const offset = (rect.width - imgWidth * scale) / 2;
      clickX = (e.clientX - rect.left - offset) / scale;
      clickY = (e.clientY - rect.top) / scale;
    } else {
      const scale = rect.width / imgWidth;
      const offset = (rect.height - imgHeight * scale) / 2;
      clickX = (e.clientX - rect.left) / scale;
      clickY = (e.clientY - rect.top - offset) / scale;
    }
    const [_, __, centerX, centerY, minX, minY, maxX, maxY] = currentItem;
    attempts++;
    if (clickX >= minX && clickX <= maxX && clickY >= minY && clickY <= maxY) {
      score++;
      updateStats();
      nextQuestion();
    } else {
      document.getElementById('test-feedback').textContent = 'Неправильно';
      document.getElementById('test-feedback').className = 'incorrect';
      updateStats();
      showHighlight(minX, minY, maxX, maxY);
    }
  });

  updateStats();
  window.addEventListener('resize', hideHighlight);
})();
