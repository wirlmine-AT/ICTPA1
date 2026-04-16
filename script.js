// --- Global Variables and Element Selection ---
const newTodoInput = document.getElementById('new-todo');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoList = document.getElementById('todo-list');
const timerMinutesDisplay = document.getElementById('timer-minutes');
const timerSecondsDisplay = document.getElementById('timer-seconds');
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

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let voyageCount = parseInt(localStorage.getItem('voyageCount')) || 0;
let timer; // To store setInterval ID
let totalSeconds = 0;
let isRunning = false;
let activeTodoIndex = -1; // Track which todo is currently being timed
let initialSailingEndHandler; // For transition cancellation

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
const possibleRewards = [
    { name: "金币", icon: "fas fa-coins", msg: "在海浪中发现了一袋沉甸甸的金币！" },
    { name: "藏宝图", icon: "fas fa-map-marked-alt", msg: "从小瓶子里翻出了一张神秘的藏宝图！" },
    { name: "红宝石", icon: "fas fa-gem", msg: "哇！这是一颗闪闪发光的深海红宝石。" },
    { name: "古老罗盘", icon: "fas fa-compass", msg: "捡到了一个刻满符文的古老罗盘。" },
    { name: "珍珠", icon: "fas fa-dot-circle", msg: "在一枚巨大的贝壳里发现了纯净的珍珠。" }
];

function checkReward() {
    voyageCount++;
    localStorage.setItem('voyageCount', voyageCount);

    // Only eligible after at least 2 voyages
    if (voyageCount >= 2) {
        // 40% chance of getting a reward
        if (Math.random() < 0.4) {
            const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
            addRewardToInventory(reward);
        }
    }
}

function addRewardToInventory(reward) {
    inventory.push({ ...reward, date: new Date().toLocaleDateString() });
    localStorage.setItem('inventory', JSON.stringify(inventory));
    renderInventory();
    
    // Show notification
    rewardNotification.classList.remove('hidden');
    alert(`【航海奖励】${reward.msg}`);
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
}

function startTimer() {
    if (isRunning) return; // Already running

    stopIdleSpeech(); // Stop boat from talking when journey starts

    const isResuming = totalSeconds > 0 && totalSeconds < parseInt(workDurationInput.value) * 60;

    if (!isResuming) {
        totalSeconds = parseInt(workDurationInput.value) * 60;
        // Start from beginning: Departure
        boat.classList.remove('departing', 'journeying');
        void boat.offsetWidth; 
        boat.classList.add('departing');
        boatStatus.textContent = '准备起航，即将进入全屏专注模式...';

        initialSailingEndHandler = () => {
            boat.removeEventListener('transitionend', initialSailingEndHandler);
            if (!isRunning) return;
            
            enterFullScreen();
            boat.classList.remove('departing');
            boat.classList.add('journeying');
            boat.style.animationDuration = totalSeconds + 's';
            boat.style.animationPlayState = 'running';
            
            boatStatus.textContent = activeTodoIndex !== -1 ? 
                `正在全速航行以完成任务 "${todos[activeTodoIndex].text}"...` : 
                '正在全速航行...';
        };
        boat.addEventListener('transitionend', initialSailingEndHandler);
    } else {
        // Resuming
        boat.style.animationPlayState = 'running';
        boatStatus.textContent = '继续航行...';
    }

    isRunning = true;
    timer = setInterval(() => {
        if (totalSeconds > 0) {
            totalSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timer);
            isRunning = false;
            alert('时间到！');
            
            if (activeTodoIndex !== -1) {
                todos[activeTodoIndex].completed = true;
                saveTodos();
                renderTodos();
                activeTodoIndex = -1;
            }

            boat.classList.remove('departing', 'journeying');
                boatStatus.textContent = '小船已抵达目的地。';
                exitFullScreen();
                checkReward(); // New: Check for random rewards on completion
                startIdleSpeech();
                new Audio('notification.mp3').play();
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
    activeTodoIndex = -1; // Reset active todo
    if (initialSailingEndHandler) {
        boat.removeEventListener('transitionend', initialSailingEndHandler);
    }
    totalSeconds = parseInt(workDurationInput.value) * 60;
    updateTimerDisplay();
    boat.classList.remove('departing', 'journeying');
    boat.style.animationDuration = '';
    boat.style.animationPlayState = '';
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
resetTimer();
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
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen-active');
        stopAmbientSounds(); // Stop sounds if user exits via ESC
        // Resume background music when exiting fullscreen, if not muted
        if (!isMuted) {
            bgMusic.play().catch(e => console.log("Playback failed"));
        }
        
        // --- Pause Timer on Exit ---
        if (isRunning) {
            pauseTimer();
        }
        
        // --- New: Return Animation Logic ---
        // Clean up any journeying styles
        boat.classList.remove('departing', 'journeying');
        boat.style.animationDuration = '';
        boat.style.animationPlayState = '';
        
        // Position boat at the left outside to start sliding back
        boat.classList.add('returning');
        void boat.offsetWidth; // Force reflow
        
        // Slide it back to the original dock position
        boat.classList.remove('returning');
        boat.classList.add('sliding-back');
        
        const returnEndHandler = () => {
            boat.classList.remove('sliding-back');
            boat.removeEventListener('transitionend', returnEndHandler);
            boatStatus.textContent = isRunning ? '已暂停航行，小船暂时回港。' : '航程结束，小船已归港。';
        };
        boat.addEventListener('transitionend', returnEndHandler);
    } else {
        playAmbientSounds(); // Play sounds if user enters manually
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
