// --- Global Variables and Element Selection ---
const newTodoInput = document.getElementById('new-todo');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const timerMinutesDisplay = document.getElementById('timer-minutes');
const timerSecondsDisplay = document.getElementById('timer-seconds');
const timerTypeDisplay = document.getElementById('timer-type');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const workDurationInput = document.getElementById('work-duration');
const breakDurationInput = document.getElementById('break-duration');
const boat = document.querySelector('.boat');
const boatStatus = document.getElementById('boat-status');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const speechBubble = document.getElementById('speech-bubble');
const chestToggleBtn = document.getElementById('chest-toggle-btn');
const chestInventory = document.getElementById('chest-inventory');
const inventoryList = document.getElementById('inventory-list');
const emptyInventoryMsg = document.getElementById('empty-inventory-msg');
const rewardNotification = document.getElementById('reward-notification');
const galleryToggleBtn = document.getElementById('gallery-toggle-btn');
const galleryViewer = document.getElementById('gallery-viewer');
const galleryPhoto = document.getElementById('gallery-photo');
const galleryLoading = document.getElementById('gallery-loading');
const nextPhotoBtn = document.getElementById('next-photo-btn');
const muteBtn = document.getElementById('mute-btn');
const treasureModal = document.getElementById('treasure-modal');
const treasureMessage = document.getElementById('treasure-message');
const closeTreasureModal = document.getElementById('close-treasure-modal');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let voyageCount = parseInt(localStorage.getItem('voyageCount')) || 0;
let timer; // To store setInterval ID
let totalSeconds = 0;
let initialTotalSeconds = 0; // Track the initial duration for animation progress
let isRunning = false;
let isBreakTime = false;
let autoContinueEnabled = true;
let activeTodoIndex = -1; // Track which todo is currently being timed
let initialSailingEndHandler; // For transition cancellation
let boatWasJourneying = false; // Track if boat was in journey mode before exiting fullscreen
let animationProgress = 0; // Track how far the animation has progressed (0 to 1)
let wasManuallyPausedFromFullscreen = false; // Track if paused by exiting fullscreen

// --- Background Music ---
const bgMusic = new Audio('陪您读书 - 937.He\'s a Pirate (加勒比海盗)(极简版钢琴曲) 伴奏 助眠解压.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5; // 50% volume
let isMuted = false;
let hasPlayedOnce = false;

// Try to play immediately on load (will probably be blocked by browser)
bgMusic.play().catch(e => {
    console.log("Autoplay blocked by browser, waiting for user interaction");
});

// Also play on first user interaction
document.addEventListener('click', function initBgMusic() {
    if (bgMusic.paused && !isMuted && !hasPlayedOnce) {
        bgMusic.play().catch(e => console.log("Playback still blocked"));
        hasPlayedOnce = true;
    }
}, { once: true });

// --- Ambient Sound Effects ---
// Using online royalty-free assets as placeholders if local ones aren't provided
const seaSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1188/1188-preview.mp3');
const seagullSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1189/1189-preview.mp3');
seaSound.loop = true;
seaSound.volume = 0.3; // Lower volume for sea sound
seagullSound.loop = true;
seagullSound.volume = 0.2; // Even lower for seagull sounds

// --- Boat Speech Logic ---
const idleMessages = [
    "今天干什么呢？",
    "准备好迎接新的航程了吗？",
    "风平浪静，正是起航的好时机！",
    "在想接下来的任务吗？",
    "休息也是航行的一部分哦。",
    "需要我载你去专注之海吗？",
    "扬帆，起航！"
];

let speechInterval;

function showSpeech() {
    if (isRunning || document.fullscreenElement) {
        speechBubble.classList.add('hidden');
        return;
    }
    
    const randomMsg = idleMessages[Math.floor(Math.random() * idleMessages.length)];
    speechBubble.textContent = randomMsg;
    speechBubble.classList.remove('hidden');
    
    setTimeout(() => {
        speechBubble.classList.add('hidden');
    }, 4000);
}

function startIdleSpeech() {
    stopIdleSpeech();
    speechInterval = setInterval(showSpeech, 10000); // Try to talk every 10 seconds
}

function stopIdleSpeech() {
    clearInterval(speechInterval);
    speechBubble.classList.add('hidden');
}

// --- Reward System Logic ---
const commonRewards = [
    { name: "金币", icon: "fas fa-coins", msg: "在海浪中发现了一袋沉甸甸的金币！" },
    { name: "藏宝图", icon: "fas fa-map-marked-alt", msg: "从小瓶子里翻出了一张神秘的藏宝图！" },
    { name: "红宝石", icon: "fas fa-gem", msg: "哇！这是一颗闪闪发光的深海红宝石。" },
    { name: "古老罗盘", icon: "fas fa-compass", msg: "捡到了一个刻满符文的古老罗盘。" },
    { name: "珍珠", icon: "fas fa-dot-circle", msg: "在一枚巨大的贝壳里发现了纯净的珍珠。" },
    { name: "银质酒杯", icon: "fas fa-glass-martini-alt", msg: "发现了一个精美的银质酒杯！" },
    { name: "航海日志", icon: "fas fa-book", msg: "找到了一本破旧但珍贵的航海日志！" },
    { name: "珊瑚项链", icon: "fas fa-necklace", msg: "一串美丽的珊瑚项链从海底浮现！" },
    { name: "望远镜", icon: "fas fa-binoculars", msg: "发现了一个古董望远镜！" },
    { name: "翡翠戒指", icon: "fas fa-ring", msg: "一枚闪耀的翡翠戒指！" }
];

const rareRewards = [
    { name: "黄金酒杯", icon: "fas fa-glass-cheers", msg: "稀有的黄金酒杯！价值连城！" },
    { name: "钻石项链", icon: "fas fa-gem", msg: "一条璀璨夺目的钻石项链！" },
    { name: "神秘水晶球", icon: "fas fa-globe", msg: "一个能预见未来的神秘水晶球！" },
    { name: "海盗王的腰带", icon: "fas fa-tshirt", msg: "传说中海盗王的腰带！" }
];

const legendaryReward = { name: "黄金三叉戟", icon: "fas fa-trident", msg: "🏆 传说中的黄金三叉戟！海神波塞冬的神器！！！" };


function checkReward() {
    voyageCount++;
    localStorage.setItem('voyageCount', voyageCount);

    // Only eligible after at least 2 voyages
    if (voyageCount >= 2) {
        // 40% chance of getting a reward
        if (Math.random() < 0.4) {
            let reward;
            const rand = Math.random();
            
            // 1% chance for legendary (黄金三叉戟)
            if (rand < 0.01) {
                reward = legendaryReward;
            }
            // 15% chance for rare rewards
            else if (rand < 0.16) {
                reward = rareRewards[Math.floor(Math.random() * rareRewards.length)];
            }
            // 84% chance for common rewards
            else {
                reward = commonRewards[Math.floor(Math.random() * commonRewards.length)];
            }
            
            addRewardToInventory(reward);
        }
    }
}

function addRewardToInventory(reward) {
    inventory.push({ ...reward, date: new Date().toLocaleDateString() });
    localStorage.setItem('inventory', JSON.stringify(inventory));
    renderInventory();
    
    // Show notification on button
    rewardNotification.classList.remove('hidden');
    
    // Show modal instead of alert
    treasureMessage.textContent = reward.msg;
    treasureModal.classList.remove('hidden');
    
    // Special effect for legendary reward (黄金三叉戟)
    if (reward.name === "黄金三叉戟") {
        const modalContent = treasureModal.querySelector('.modal-content');
        modalContent.style.animation = 'legendary-pulse 0.5s ease-in-out 3';
        
        // Play a special sound effect if not muted
        if (!isMuted) {
            const legendarySound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
            legendarySound.volume = 0.7;
            legendarySound.play().catch(e => console.log("Legendary sound failed"));
        }
    }
}

function renderInventory() {
    inventoryList.innerHTML = '';
    if (inventory.length === 0) {
        emptyInventoryMsg.classList.remove('hidden');
    } else {
        emptyInventoryMsg.classList.add('hidden');
        inventory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="${item.icon}"></i> <span>${item.name} (${item.date})</span>`;
            inventoryList.appendChild(li);
        });
    }
}

// Chest Toggle
chestToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chestInventory.classList.toggle('hidden');
    rewardNotification.classList.add('hidden'); // Hide notification when opened
});

function playAmbientSounds() {
    if (!isMuted) {
        seaSound.play().catch(e => console.log("Audio play failed:", e));
        seagullSound.play().catch(e => console.log("Audio play failed:", e));
    }
}

function stopAmbientSounds() {
    seaSound.pause();
    seagullSound.pause();
    seaSound.currentTime = 0;
    seagullSound.currentTime = 0;
}

const SAILING_TRANSITION_DURATION_SECONDS = 5; 
const RETURN_THRESHOLD_SECONDS = 10; 

// --- Todo List Functionality ---
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        const isActive = index === activeTodoIndex;
        li.className = (todo.completed ? 'completed' : '') + (isActive ? ' active-todo' : '');
        li.innerHTML = `
            <span class="todo-text">${todo.text}</span>
            <div class="todo-actions">
                <button class="start-todo-btn" data-index="${index}">${isActive ? '<i class="fas fa-ship"></i> 航行中...' : '<i class="fas fa-play"></i> 开始'}</button>
                <button class="complete-btn" data-index="${index}"><i class="fas fa-check"></i></button>
                <button class="delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        todoList.appendChild(li);
    });
    addTodoListeners();
}

function addTodoListeners() {
    document.querySelectorAll('.complete-btn').forEach(button => {
        button.onclick = (e) => toggleComplete(e.target.dataset.index);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = (e) => deleteTodo(e.target.dataset.index);
    });
    // New: Event listener for start buttons
    document.querySelectorAll('.start-todo-btn').forEach(button => {
        button.onclick = (e) => startTodoTimer(e.target.dataset.index);
    });
}

function startTodoTimer(index) {
    if (isRunning) {
        alert('一个任务已经在进行中！请先暂停或重置当前计时器。');
        return;
    }

    activeTodoIndex = parseInt(index);
    renderTodos(); // Refresh to show highlight
    
    const todoText = todos[activeTodoIndex].text;
    // Set timer duration based on work duration input
    totalSeconds = parseInt(workDurationInput.value) * 60;
    updateTimerDisplay(); // Update display immediately
    startTimer(); // Start the timer and boat animation
    boatStatus.textContent = `小船正在为任务 "${todoText}" 航行...`;
}

function addTodo() {
    const todoText = newTodoInput.value.trim();
    if (todoText) {
        todos.push({ text: todoText, completed: false });
        newTodoInput.value = '';
        saveTodos();
        renderTodos();
    }
}

function toggleComplete(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    saveTodos();
    renderTodos();
}

addTodoBtn.addEventListener('click', addTodo);
newTodoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

renderTodos();

// --- Timer Functionality ---

function updateTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerMinutesDisplay.textContent = String(minutes).padStart(2, '0');
    timerSecondsDisplay.textContent = String(seconds).padStart(2, '0');
    
    // Update timer type display
    if (isBreakTime) {
        timerTypeDisplay.innerHTML = '<i class="fas fa-coffee"></i> 休息倒计时';
        timerTypeDisplay.style.color = '#2e7d32';
    } else {
        timerTypeDisplay.innerHTML = '<i class="fas fa-anchor"></i> 航海倒计时';
        timerTypeDisplay.style.color = '#8b4513';
    }
}

function updateFullscreenButton() {
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = '退出全屏';
    } else {
        fullscreenBtn.textContent = '去看风景';
    }
}

function updateStartButton() {
    if (wasManuallyPausedFromFullscreen) {
        startTimerBtn.innerHTML = '<i class="fas fa-play"></i> 继续';
    } else {
        startTimerBtn.innerHTML = '<i class="fas fa-play"></i> 开始';
    }
}

function startTimer() {
    if (isRunning) return; // Already running

    stopIdleSpeech(); // Stop boat from talking when journey starts

    wasManuallyPausedFromFullscreen = false;
    updateStartButton();

    const isResuming = totalSeconds > 0 && totalSeconds < initialTotalSeconds;
    const isWorkDuration = totalSeconds === parseInt(workDurationInput.value) * 60;
    const isContinuingFromBreak = isBreakTime || (totalSeconds === parseInt(breakDurationInput.value) * 60);
    const isFreshStart = (isWorkDuration && !isBreakTime) || (activeTodoIndex !== -1 && !isResuming);

    if (isFreshStart || (!isResuming && !isContinuingFromBreak)) {
        if (!isWorkDuration) {
            totalSeconds = parseInt(workDurationInput.value) * 60;
        }
        initialTotalSeconds = totalSeconds;
        animationProgress = 0;
        isBreakTime = false;
        boatWasJourneying = false;
        // Start from beginning: Departure
        boat.classList.remove('departing', 'journeying', 'resume');
        boat.style.animation = '';
        boat.style.animationDelay = '';
        boat.style.display = ''; // Make sure boat is visible before departure
        void boat.offsetWidth; 
        boat.classList.add('departing');
        boatStatus.textContent = '准备起航，即将进入全屏专注模式...';

        initialSailingEndHandler = () => {
            boat.removeEventListener('transitionend', initialSailingEndHandler);
            if (!isRunning) return;
            
            enterFullScreen();
            boat.classList.remove('departing');
            boat.classList.add('journeying');
            boat.style.animation = `boat-journey ${initialTotalSeconds}s linear forwards`;
            boat.style.animationPlayState = 'running';
            
            boatStatus.textContent = activeTodoIndex !== -1 ? 
                `正在全速航行以完成任务 "${todos[activeTodoIndex].text}"...` : 
                '正在全速航行...';
        };
        boat.addEventListener('transitionend', initialSailingEndHandler);
    } else if (isContinuingFromBreak && !isBreakTime) {
        // Continuing work after break
        initialTotalSeconds = parseInt(workDurationInput.value) * 60;
        totalSeconds = initialTotalSeconds;
        animationProgress = 0;
        boatWasJourneying = false;
        boat.classList.remove('departing', 'journeying', 'resume');
        boat.style.animation = '';
        boat.style.animationDelay = '';
        boat.style.display = ''; // Make sure boat is visible before departure
        void boat.offsetWidth; 
        boat.classList.add('departing');
        boatStatus.textContent = '休息结束，准备再次起航...';

        initialSailingEndHandler = () => {
            boat.removeEventListener('transitionend', initialSailingEndHandler);
            if (!isRunning) return;
            
            enterFullScreen();
            boat.classList.remove('departing');
            boat.classList.add('journeying');
            boat.style.animation = `boat-journey ${initialTotalSeconds}s linear forwards`;
            boat.style.animationPlayState = 'running';
            
            boatStatus.textContent = activeTodoIndex !== -1 ? 
                `正在全速航行以完成任务 "${todos[activeTodoIndex].text}"...` : 
                '正在全速航行...';
        };
        boat.addEventListener('transitionend', initialSailingEndHandler);
    } else {
        // Resuming from pause
        if (boatWasJourneying && !isBreakTime) {
            // We were in journey mode before, go straight to fullscreen and continue animation
            enterFullScreen();
            boat.classList.remove('departing');
            boat.classList.add('journeying', 'resume');
            
            const timeElapsed = initialTotalSeconds - totalSeconds;
            const delay = -timeElapsed;
            boat.style.animation = `boat-journey ${initialTotalSeconds}s linear forwards`;
            boat.style.animationDelay = `${delay}s`;
            boat.style.animationPlayState = 'running';
            
            boatStatus.textContent = activeTodoIndex !== -1 ? 
                `正在全速航行以完成任务 "${todos[activeTodoIndex].text}"...` : 
                '正在全速航行...';
            boatWasJourneying = false;
        } else if (isBreakTime) {
            boatStatus.textContent = '休息中...';
        } else {
            boatStatus.textContent = '继续航行...';
        }
    }

    updateTimerDisplay();
    isRunning = true;
    timer = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timer);
            isRunning = false;
            
            if (!isBreakTime) {
                // --- 航海倒计时结束 ---
                
                // --- 1. 自动退出全屏 ---
                exitFullScreen();
                
                // --- 2. 完成任务标记 ---
                if (activeTodoIndex !== -1) {
                    todos[activeTodoIndex].completed = true;
                    saveTodos();
                    renderTodos();
                    activeTodoIndex = -1;
                }
                
                // --- 3. 小船归港 ---
                boat.classList.remove('departing', 'journeying', 'resume');
                boat.style.animation = '';
                boat.style.animationDelay = '';
                boat.style.animationPlayState = '';
                boat.style.display = '';
                
                // 显示圆满完成状态
                boatStatus.textContent = '🎉 圆满完成！小船已抵达目的地。';
                
                // --- 4. 播放提醒音效 ---
                if (!isMuted) {
                    const completionSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                    completionSound.volume = 0.5;
                    completionSound.play().catch(e => console.log("Sound failed"));
                }
                
                // --- 5. 检查宝藏 ---
                checkReward();
                
                // --- 6. 恢复闲置语音 ---
                startIdleSpeech();
                
                // --- 7. 自动进入休息倒计时 ---
                isBreakTime = true;
                totalSeconds = parseInt(breakDurationInput.value) * 60;
                initialTotalSeconds = totalSeconds;
                // 小船在码头停靠
                boatStatus.textContent = '休息中...准备再次起航！';
                updateTimerDisplay();
                startTimer();
                
            } else {
                // --- 休息倒计时结束 ---
                
                // 不退出全屏，保持当前状态
                // 不自动开始下一轮，完成闭环等待用户操作
                
                // 小船在码头停靠
                boat.classList.remove('departing', 'journeying', 'resume');
                boat.style.animation = '';
                boat.style.animationDelay = '';
                boat.style.animationPlayState = '';
                boat.style.display = '';
                boatStatus.textContent = '休息结束，等待您的下一次航行！';
                
                // 播放提醒音效
                if (!isMuted) {
                    const completionSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
                    completionSound.volume = 0.5;
                    completionSound.play().catch(e => console.log("Sound failed"));
                }
                
                // 恢复闲置语音
                startIdleSpeech();
                
                // 重置为航海倒计时状态，等待用户操作
                isBreakTime = false;
                totalSeconds = parseInt(workDurationInput.value) * 60;
                initialTotalSeconds = totalSeconds;
                wasManuallyPausedFromFullscreen = false;
                updateTimerDisplay();
                updateStartButton();
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    isRunning = false;
    boat.style.animationPlayState = 'paused';
    startIdleSpeech(); // Start talking again when paused
    if (initialSailingEndHandler) {
        boat.removeEventListener('transitionend', initialSailingEndHandler);
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isBreakTime = false;
    boatWasJourneying = false;
    animationProgress = 0;
    wasManuallyPausedFromFullscreen = false;
    activeTodoIndex = -1; // Reset active todo
    if (initialSailingEndHandler) {
        boat.removeEventListener('transitionend', initialSailingEndHandler);
    }
    totalSeconds = parseInt(workDurationInput.value) * 60;
    initialTotalSeconds = totalSeconds;
    updateTimerDisplay();
    updateStartButton();
    boat.classList.remove('departing', 'journeying', 'sliding-back', 'returning', 'resume');
    boat.style.animation = '';
    boat.style.animationDelay = '';
    boat.style.animationPlayState = '';
    boat.style.display = ''; // Make sure boat is visible
    boatStatus.textContent = '小船停靠在码头。'; // Reset status text
    exitFullScreen(); // Ensure full screen is exited on reset
    startIdleSpeech(); // Start talking again on reset
    renderTodos(); // Refresh to clear highlighting
}

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

workDurationInput.addEventListener('change', resetTimer);
breakDurationInput.addEventListener('change', resetTimer);

// Initialize timer display
totalSeconds = parseInt(workDurationInput.value) * 60;
initialTotalSeconds = totalSeconds;
updateTimerDisplay();
updateFullscreenButton();
updateStartButton();
renderInventory(); // Load saved rewards
startIdleSpeech(); // Start talking initially


// --- Fullscreen Functionality ---

fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
        exitFullScreen();
    } else {
        enterFullScreen();
    }
});

function enterFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            document.body.classList.add('fullscreen-active');
            // Pause background music when entering fullscreen
            bgMusic.pause();
            playAmbientSounds(); // Play sounds on entering fullscreen
        }).catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    }
}

function exitFullScreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen().then(() => {
            document.body.classList.remove('fullscreen-active');
            stopAmbientSounds(); // Stop sounds on exiting fullscreen
            // Resume background music when exiting fullscreen, if not muted
            if (!isMuted) {
                bgMusic.play().catch(e => console.log("Playback failed"));
            }
        }).catch(err => {
            console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
        });
    }
}

// Event listener for changes in fullscreen mode (remains for manual exit or browser exit)
document.addEventListener('fullscreenchange', () => {
    updateFullscreenButton();
    
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen-active');
        stopAmbientSounds(); // Stop sounds if user exits via ESC
        // Resume background music when exiting fullscreen, if not muted
        if (!isMuted) {
            bgMusic.play().catch(e => console.log("Playback failed"));
        }
        
        // Save boat state before exiting
        boatWasJourneying = boat.classList.contains('journeying');
        
        // --- Pause Timer on Exit ---
        if (isRunning) {
            wasManuallyPausedFromFullscreen = true;
            pauseTimer();
            updateStartButton();
            // Keep boat hidden and show it's temporarily away
            boat.classList.remove('departing', 'journeying', 'resume');
            boat.style.animation = '';
            boat.style.animationDelay = '';
            boat.style.animationPlayState = '';
            boat.style.display = 'none'; // Hide the boat completely
            // Show boat as temporarily away
            boatStatus.textContent = '已暂停航行，小船暂时离开码头，航海中……';
        }
    } else {
        playAmbientSounds(); // Play sounds if user enters manually
        // Show boat again when entering fullscreen if needed
        if (boat.style.display === 'none') {
            boat.style.display = '';
        }
    }
});

// --- Gallery Logic ---
const seaPhotoUrls = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1476673160081-cf065f8c9c36?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1501785888041-af3ef281b39?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=800&h=600&fit=crop"
];
let currentPhotoIndex = 0;

async function fetchSeaPhoto() {
    galleryPhoto.style.display = 'none';
    galleryLoading.style.display = 'flex';
    
    try {
        // Use the curated list of sea photos
        const photoUrl = seaPhotoUrls[currentPhotoIndex];
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            galleryPhoto.src = photoUrl;
            galleryPhoto.style.display = 'block';
            galleryLoading.style.display = 'none';
            // Move to next photo for next time
            currentPhotoIndex = (currentPhotoIndex + 1) % seaPhotoUrls.length;
        };
        img.onerror = () => {
            galleryPhoto.style.display = 'none';
            galleryLoading.innerHTML = '<span>图片加载失败，请稍后重试</span>';
            galleryLoading.style.display = 'flex';
            // Still try next index on error
            currentPhotoIndex = (currentPhotoIndex + 1) % seaPhotoUrls.length;
        };
        img.src = photoUrl;
    } catch (error) {
        console.error("Error fetching sea photo:", error);
        galleryPhoto.style.display = 'none';
        galleryLoading.innerHTML = '<span>图片加载失败，请稍后重试</span>';
        galleryLoading.style.display = 'flex';
    }
}

// Gallery Toggle
galleryToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    chestInventory.classList.add('hidden'); // Close chest when opening gallery
    galleryViewer.classList.toggle('hidden');
    if (!galleryViewer.classList.contains('hidden') && !galleryPhoto.src) {
        fetchSeaPhoto(); // Load first photo when opened
    }
});

// Next Photo
nextPhotoBtn.addEventListener('click', fetchSeaPhoto);

// Close gallery when clicking outside
document.addEventListener('click', (e) => {
    const chestContainer = document.getElementById('treasure-chest-container');
    const galleryContainer = document.getElementById('gallery-container');
    
    if (chestContainer && !chestContainer.contains(e.target)) {
        chestInventory.classList.add('hidden');
    }
    
    if (galleryContainer && !galleryContainer.contains(e.target)) {
        galleryViewer.classList.add('hidden');
    }
});

// --- Mute Button Logic ---
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    const icon = muteBtn.querySelector('i');
    
    if (isMuted) {
        bgMusic.pause();
        seaSound.pause();
        seagullSound.pause();
        icon.classList.remove('fa-volume-up');
        icon.classList.add('fa-volume-mute');
    } else {
        // Only play background music if NOT in fullscreen
        if (!document.fullscreenElement) {
            bgMusic.play().catch(e => console.log("Playback failed, user interaction required"));
        }
        // Only play ambient sounds if in fullscreen
        if (document.fullscreenElement) {
            playAmbientSounds();
        }
        icon.classList.remove('fa-volume-mute');
        icon.classList.add('fa-volume-up');
    }
});

// --- Modal Logic ---
closeTreasureModal.addEventListener('click', () => {
    treasureModal.classList.add('hidden');
});

treasureModal.addEventListener('click', (e) => {
    if (e.target === treasureModal) {
        treasureModal.classList.add('hidden');
    }
});
