document.addEventListener('DOMContentLoaded', () => {
    // DOM Element Selection
    const charLevelEl = document.getElementById('char-level');
    const hpBar = document.getElementById('hp-bar');
    const xpBar = document.getElementById('xp-bar');
    const activeQuestListEl = document.getElementById('active-quest-list');
    const completedQuestListEl = document.getElementById('completed-quest-list');
    const addQuestBtn = document.getElementById('add-quest-btn');
    const newQuestInput = document.getElementById('new-quest-input');
    const notificationEl = document.getElementById('notification');
    const inventoryListEl = document.getElementById('inventory-list');
    const skillsListEl = document.getElementById('skills-list');
    const monsterSpriteEl = document.getElementById('monster-sprite');
    const monsterNameEl = document.getElementById('monster-name');
    const slashFxEl = document.getElementById('slash-fx');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const rightColumnEl = document.querySelector('.right-column');

    // Game Data
    let player;
    let quests;
    let nextQuestId;

    // ASCII Art Monsters
    const monsters = [
        { name: "Goblin", art: " (o_o) \n /|'|\\ \n  / \\ " },
        { name: "Slime", art: " \\___/ \n (o.o) \n /   \\ " },
        { name: "Skeleton", art: "  .-.  \n (o.o) \n |'|'| \n  '|'  " },
        { name: "Dire Wolf", art: " /\\_/\\ \n( o.o )\n > ^ < " }
    ];

    const defaultPlayer = {
        level: 1, hp: 100, maxHp: 100, xp: 0, xpToNextLevel: 100,
        skills: ["Beginner's Luck"], inventory: ["Health Potion"]
    };
    const defaultQuests = [
        { id: 1, title: "Quest: Obtain the Morning Elixir", description: "Prepare a cup of coffee or tea.", reward: { xp: 10 }, completed: false },
        { id: 2, title: "Quest: Cleanse the Dirty Dungeon", description: "Tidy up your room.", reward: { xp: 25 }, completed: false },
        { id: 3, title: "Quest: Read a Tome of Wisdom", description: "Read a book for 15 minutes.", reward: { xp: 20 }, completed: false },
        { id: 4, title: "Quest: Feat of Strength", description: "Do a short workout.", reward: { xp: 30, item: "Energy Drink" }, completed: false }
    ];

    function saveGame() {
        localStorage.setItem('rpg_playerData', JSON.stringify(player));
        localStorage.setItem('rpg_questsData', JSON.stringify(quests));
    }

    function loadGame() {
        player = JSON.parse(localStorage.getItem('rpg_playerData')) || { ...defaultPlayer };
        quests = JSON.parse(localStorage.getItem('rpg_questsData')) || [...defaultQuests];
        nextQuestId = quests.length > 0 ? Math.max(...quests.map(q => q.id)) + 1 : 1;
    }

    function spawnMonster() {
        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        monsterSpriteEl.innerText = monster.art;
        monsterNameEl.innerText = `A wild ${monster.name} appears!`;
        monsterSpriteEl.classList.remove('monster-death');
    }

    function attackMonster() {
        slashFxEl.classList.add('slash-animation');
        monsterSpriteEl.classList.add('monster-hit');
        setTimeout(() => {
            monsterSpriteEl.classList.add('monster-death');
            monsterNameEl.innerText = "Foe Vanquished!";
        }, 300);
        setTimeout(() => {
            slashFxEl.classList.remove('slash-animation');
            monsterSpriteEl.classList.remove('monster-hit');
            spawnMonster();
        }, 1500);
    }

    function updateUI() {
        charLevelEl.textContent = player.level;
        hpBar.textContent = `${player.hp}/${player.maxHp}`;
        hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
        xpBar.textContent = `${player.xp}/${player.xpToNextLevel}`;
        xpBar.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        inventoryListEl.innerHTML = player.inventory.map(item => `<li>${item}</li>`).join('');
        skillsListEl.innerHTML = player.skills.map(skill => `<li>${skill}</li>`).join('');
        renderQuests();
        saveGame();
    }

    function renderQuests() {
        activeQuestListEl.innerHTML = '';
        completedQuestListEl.innerHTML = '';
        
        quests.forEach(quest => {
            const questEl = document.createElement('div');
            questEl.className = `quest ${quest.completed ? 'completed' : ''}`;
            let rewardText = `${quest.reward.xp} XP`;
            if (quest.reward.item) rewardText += ` + ${quest.reward.item} (Rare!)`;

            questEl.innerHTML = `
                <div class="quest-info">
                    <div class="quest-title">${quest.title}</div>
                    <div class="quest-desc">${quest.description}</div>
                    <div class="quest-reward">Reward: ${rewardText}</div>
                </div>
                <div class="quest-actions">
                    ${!quest.completed ? `<button class="complete-btn" data-quest-id="${quest.id}">Complete</button>` : ''}
                    <button class="delete-btn" data-quest-id="${quest.id}" title="Delete Quest">X</button>
                </div>`;
            
            if (quest.completed) {
                completedQuestListEl.appendChild(questEl);
            } else {
                activeQuestListEl.appendChild(questEl);
            }
        });
    }
    
    function showNotification(message, type = 'success') {
        notificationEl.textContent = message;
        notificationEl.className = `show ${type}`;
        setTimeout(() => { notificationEl.className = 'hidden'; }, 3000);
    }

    function completeQuest(id) {
        const quest = quests.find(q => q.id === id);
        if (quest && !quest.completed) {
            quest.completed = true;
            player.xp += quest.reward.xp;
            attackMonster();
            let notificationMessage = `Quest Complete! +${quest.reward.xp} XP!`;
            if (quest.reward.item) {
                player.inventory.push(quest.reward.item);
                notificationMessage += ` You found: "${quest.reward.item}"!`;
            }
            showNotification(notificationMessage, 'success');
            checkLevelUp();
            updateUI();
        }
    }

    function deleteQuest(id) {
        quests = quests.filter(q => q.id !== id);
        showNotification("Quest removed.", "error");
        updateUI();
    }

    function clearCompletedQuests() {
        quests = quests.filter(q => !q.completed);
        showNotification("Completed quests cleared.", "success");
        updateUI();
    }

    function checkLevelUp() {
        if (player.xp >= player.xpToNextLevel) {
            player.level++;
            player.xp -= player.xpToNextLevel;
            player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
            player.maxHp += 10;
            player.hp = player.maxHp;
            let levelUpMessage = `Congratulations! You reached Level ${player.level}!`;
            if (player.level === 2 && !player.skills.includes("Focus Spell")) {
                player.skills.push("Focus Spell");
                levelUpMessage += ` You learned "Focus Spell"!`;
            }
            showNotification(levelUpMessage, 'level-up');
        }
    }

    function addQuest() {
        const questTitle = newQuestInput.value.trim();
        if (questTitle) {
            const newQuest = {
                id: nextQuestId++,
                title: `Custom Quest: ${questTitle}`,
                description: "Complete this self-assigned adventure.",
                reward: { xp: Math.floor(Math.random() * 20) + 15 },
                completed: false
            };
            quests.unshift(newQuest);
            newQuestInput.value = '';
            updateUI();
            showNotification("A new custom quest has been added!");
        } else {
            showNotification("Please enter a quest title.", "error");
        }
    }

    // --- EVENT LISTENERS ---
    addQuestBtn.addEventListener('click', addQuest);
    newQuestInput.addEventListener('keypress', (e) => e.key === 'Enter' && addQuest());
    clearCompletedBtn.addEventListener('click', clearCompletedQuests);

    // Event delegation for quest buttons (complete/delete)
    rightColumnEl.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('complete-btn')) {
            completeQuest(parseInt(target.dataset.questId, 10));
        } else if (target.classList.contains('delete-btn')) {
            deleteQuest(parseInt(target.dataset.questId, 10));
        }
    });

    // --- INITIALIZATION ---
    loadGame();
    spawnMonster();
    updateUI();
});
