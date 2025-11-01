// ===== GAME CONFIGURATION =====
const CONFIG = {
    // Game settings
    MAX_ATTEMPTS: 0, // 0 = unlimited
    ENABLE_HINTS: true,
    
    // UI settings
    SEARCH_RESULTS_LIMIT: 20,
    AUTO_SCROLL_TO_NEW_GUESS: true,
    
    // Feedback settings
    SHOW_CORRECT_ATTRIBUTES_ON_WIN: true,
    DISPLAY_CHARACTER_IMAGE_ON_WIN: true,
    
    // Animation settings
    ENABLE_ANIMATIONS: true,
    ANIMATION_DURATION: 300,
    
    // Local storage settings
    SAVE_GAME_STATE: true,
    STORAGE_KEY: 'bg3dle_game_state',
    
    // API paths (already in loadCharacterData, but centralized here for visibility)
    DATA_PATHS: [
        '../../assets/data_as_map.json',
        '../assets/data_as_map.json',
        'assets/data_as_map.json',
        './data_as_map.json'
    ],
    
    IMAGE_BASE_PATH: '../../assets/pics/'
};

// ===== COLOR THEME ALIASES (for consistency with CSS) =====
const THEME = {
    correct: 'correct',
    wrong: 'wrong', 
    partial: 'partial',
    arrowUp: 'arrow-up',
    arrowDown: 'arrow-down'
};

// Rest of your existing code continues...

























// Character database - will be loaded from JSON
let characters = {};
let answer = '';
let feedbackHistory = [];
let attempts = 0;
let gameActive = true;
let currentSearchResults = [];

// Load character data from JSON
async function loadCharacterData() {
    try {
        // Try different possible paths for the JSON file
        const possiblePaths = [
            '../../assets/data_as_map.json',
            '../assets/data_as_map.json',
            'assets/data_as_map.json',
            './data_as_map.json'
        ];
        
        let response;
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                console.log(`Failed to load from ${path}, trying next...`);
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Failed to load character data from all paths`);
        }
        
        characters = await response.json();
        console.log('Character data loaded successfully', characters);
        initGame();
        
    } catch (error) {
        console.error('Error loading character data:', error);
        updateGameMessage('Error loading character data. Please check the console and refresh the page.', 'error');
    }
}

// Initialize the game
function initGame() {
    // Choose random character
    const characterNames = Object.keys(characters);
    if (characterNames.length === 0) {
        updateGameMessage('No character data available!', 'error');
        return;
    }
    
    answer = characterNames[Math.floor(Math.random() * characterNames.length)];
    console.log('Answer:', answer); // For debugging
    
    attempts = 0;
    feedbackHistory = [];
    gameActive = true;
    currentSearchResults = [];
    
    updateGameMessage('Guess todays Baldur\'s Gate 3 character!', 'initial');
    updateFeedbackHistory();
    
    // Setup search functionality
    const searchInput = document.getElementById('characterSearch');
    searchInput.placeholder = 'Type a character name...';
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleEnterKey();
        }
    });
    
    // Enable the input now that data is loaded
    searchInput.disabled = false;
    document.getElementById('guessButton').disabled = false;
    document.getElementById('newGameButton').style.display = 'none';
}

// Handle search input
function handleSearch() {
    const searchTerm = this.value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    
    // Reset scroll position to top
    resultsContainer.scrollTop = 0;
    
    if (searchTerm.length < 1) {
        resultsContainer.style.display = 'none';
        currentSearchResults = [];
        return;
    }
    
    // Filter characters that haven't been guessed yet
    const guessedCharacters = new Set(feedbackHistory.map(entry => entry.guess));
    const filteredCharacters = Object.keys(characters).filter(character => 
        character.toLowerCase().includes(searchTerm) && !guessedCharacters.has(character)
    );
    
    currentSearchResults = filteredCharacters;
    displaySearchResults(filteredCharacters);
}

// Display search results with images
function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    // Show all results (or limit to a reasonable number)
    results.slice(0, 20).forEach(character => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        // Create image element
        const img = document.createElement('img');
        const characterData = characters[character];
        if (characterData && characterData.image) {
            img.src = `../../assets/pics/${characterData.image}`;
            img.alt = character;
            img.className = 'search-result-image';
            img.onerror = function() {
                // If image fails to load, hide the image element
                this.style.display = 'none';
            };
        } else {
            // Placeholder if no image
            img.style.display = 'none';
        }
        
        // Create name element
        const nameSpan = document.createElement('span');
        nameSpan.className = 'search-result-name';
        nameSpan.textContent = character;
        
        // Append image and name to result item
        resultItem.appendChild(img);
        resultItem.appendChild(nameSpan);
        
        resultItem.onclick = () => {
            document.getElementById('characterSearch').value = character;
            resultsContainer.style.display = 'none';
            submitGuess();
        };
        
        resultsContainer.appendChild(resultItem);
    });
    
    resultsContainer.style.display = 'block';
}

// Handle Enter key press
function handleEnterKey() {
    const searchInput = document.getElementById('characterSearch');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        // If there are search results, use the first one
        if (currentSearchResults.length > 0) {
            document.getElementById('characterSearch').value = currentSearchResults[0];
            document.getElementById('searchResults').style.display = 'none';
        }
        submitGuess();
    }
}

// Submit guess
function submitGuess() {
    if (!gameActive) {
        updateGameMessage('Game over! Start a new game to play again.', 'error');
        return;
    }
    
    const guessInput = document.getElementById('characterSearch');
    const guessName = guessInput.value.trim();
    
    if (!guessName) {
        updateGameMessage('Please enter a character name!', 'error');
        return;
    }
    
    if (!characters[guessName]) {
        updateGameMessage(`"${guessName}" is not in the database! Try someone else.`, 'error');
        return;
    }
    
    // Check if character was already guessed
    if (feedbackHistory.some(entry => entry.guess === guessName)) {
        updateGameMessage(`You already guessed "${guessName}"! Try someone else.`, 'error');
        return;
    }
    
    attempts++;
    const feedback = checkGuess(guessName, answer);
    
    if (typeof feedback === 'string') {
        updateGameMessage(feedback, 'error');
        attempts--; // Don't count invalid attempts
        return;
    }
    
    // Add new guess to the beginning of the array (newest first)
    feedbackHistory.unshift({ guess: guessName, feedback: feedback });
    updateFeedbackHistory();
    
    // Clear input and hide results
    guessInput.value = '';
    document.getElementById('searchResults').style.display = 'none';
    currentSearchResults = [];
    
    if (guessName === answer) {
        gameActive = false;
        updateGameMessage(`🎉 Correct! You guessed "${guessName}" in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`, 'success');
        displayCharacterAttributes(guessName);
        document.getElementById('newGameButton').style.display = 'inline-block';
    } else {
        updateGameMessage(`Incorrect! Try again. Attempts: ${attempts}`, 'info');
    }
}

// Check guess against answer
function checkGuess(guessName, answerName) {
    if (!characters[guessName]) {
        return `"${guessName}" is not in the database!`;
    }

    const guess = characters[guessName];
    const answerChar = characters[answerName];

    const feedback = {};

    for (const key in answerChar) {
        if (key === "image") continue;

        const guessValue = guess[key];
        const answerValue = answerChar[key];

        // Handle correct matches
        if (guessValue === answerValue) {
            feedback[key] = { 
                value: guessValue, 
                status: 'correct',
                display: formatDisplayValue(guessValue)
            };
            continue;
        }

        // Handle role attribute with partial matching
        if (key === "role") {
            const guessRoles = guessValue ? guessValue.split(',').map(r => r.trim()) : [];
            const answerRoles = answerValue ? answerValue.split(',').map(r => r.trim()) : [];
            
            // Check for any matching roles
            const hasMatchingRole = guessRoles.some(role => 
                answerRoles.some(answerRole => 
                    role.toLowerCase() === answerRole.toLowerCase()
                )
            );
            
            const allRolesMatch = guessRoles.length === answerRoles.length && 
                                 guessRoles.every(role => 
                                     answerRoles.some(answerRole => 
                                         role.toLowerCase() === answerRole.toLowerCase()
                                     )
                                 );
            
            if (allRolesMatch) {
                feedback[key] = { 
                    value: guessValue, 
                    status: 'correct',
                    display: formatDisplayValue(guessValue)
                };
            } else if (hasMatchingRole) {
                feedback[key] = { 
                    value: guessValue, 
                    status: 'partial',
                    display: formatDisplayValue(guessValue)
                };
            } else {
                feedback[key] = { 
                    value: guessValue, 
                    status: 'wrong',
                    display: formatDisplayValue(guessValue)
                };
            }
            continue;
        }

        // Handle firstAppearance - always red if not correct (no arrows)
        if (key === "firstAppearance") {
            feedback[key] = { 
                value: guessValue, 
                status: 'wrong',
                display: formatDisplayValue(guessValue)
            };
            continue;
        }

        // Handle weight - red with directional arrows when wrong
        if (key === "weight") {
            const guessWeight = extractWeight(guessValue);
            const answerWeight = extractWeight(answerValue);
            
            if (guessWeight && answerWeight) {
                feedback[key] = { 
                    value: guessValue, 
                    status: guessWeight < answerWeight ? 'wrong arrow-up' : 'wrong arrow-down',
                    display: formatDisplayValue(guessValue)
                };
            } else {
                feedback[key] = { 
                    value: guessValue, 
                    status: 'wrong',
                    display: formatDisplayValue(guessValue)
                };
            }
            continue;
        }

        // Handle all other attributes (gender, type, race, class, size)
        feedback[key] = { 
            value: guessValue, 
            status: 'wrong',
            display: formatDisplayValue(guessValue)
        };
    }
    
    return feedback;
}

// Helper functions
function extractActNumber(actString) {
    if (!actString) return null;
    const match = actString.toString().match(/Act\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
}

function extractWeight(weightString) {
    if (!weightString) return null;
    const match = weightString.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
}

function formatDisplayValue(value) {
    if (value === null || value === undefined) return 'Unknown';
    return value.toString();
}

function formatAttributeName(key) {
    const nameMap = {
        'gender': 'Gender',
        'type': 'Type',
        'race': 'Race',
        'class': 'Class',
        'role': 'Role',
        'firstAppearance': 'First Appearance',
        'size': 'Size',
        'weight': 'Weight'
    };
    
    return nameMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

// Update game message
function updateGameMessage(message, type) {
    const messageElement = document.getElementById('gameMessage');
    messageElement.textContent = message;
    messageElement.className = `game-message ${type}`;
    messageElement.style.display = 'block';
    
    // Add animation if enabled
    if (CONFIG.ENABLE_ANIMATIONS) {
        messageElement.style.animation = 'none';
        setTimeout(() => {
            messageElement.style.animation = `fadeIn ${CONFIG.ANIMATION_DURATION}ms ease`;
        }, 10);
    }
}

function updateFeedbackHistory() {
    const historyContainer = document.getElementById('feedbackHistory');
    historyContainer.innerHTML = '';
    
    if (feedbackHistory.length === 0) {
        // Show empty state message
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-guesses';
        emptyMessage.textContent = 'No guesses yet. Make your first guess above!';
        historyContainer.appendChild(emptyMessage);
        return;
    }
    
    // Define the attribute order for the table
    const attributeOrder = [
        'gender', 'type', 'race', 'class', 'role', 
        'firstAppearance', 'size', 'weight'
    ];
    
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'feedback-table-container';
    
    // Create table
    const table = document.createElement('table');
    table.className = 'feedback-table';
    
    // Create header row in thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Add Guess header
    const guessHeader = document.createElement('th');
    guessHeader.textContent = 'Guess';
    headerRow.appendChild(guessHeader);
    
    // Add attribute headers
    attributeOrder.forEach(attr => {
        const th = document.createElement('th');
        th.textContent = formatAttributeName(attr);
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create tbody for data rows
    const tbody = document.createElement('tbody');
    
    // Add data rows (feedbackHistory is already in newest-first order)
    feedbackHistory.forEach((entry, index) => {
        const row = document.createElement('tr');
        
        // Add guess cell with image and name
        const guessCell = document.createElement('td');
        guessCell.className = 'guess-with-image';
        
        const character = characters[entry.guess];
        if (character && character.image) {
            const img = document.createElement('img');
            img.src = `../../assets/pics/${character.image}`;
            img.alt = entry.guess;
            img.className = 'character-image';
            img.onerror = function() {
                this.style.display = 'none';
            };
            guessCell.appendChild(img);
        }
        
        const nameSpan = document.createElement('div');
        nameSpan.className = 'character-name';
        nameSpan.textContent = entry.guess;
        guessCell.appendChild(nameSpan);
        
        row.appendChild(guessCell);
        
        // Add attribute cells
        attributeOrder.forEach(attr => {
            const cell = document.createElement('td');
            const feedback = entry.feedback[attr];
            
            if (feedback) {
                let displayText = feedback.display;
                let cellClass = '';
                
                // Determine cell styling
                if (feedback.status === 'correct') {
                    cellClass = 'cell-correct';
                } else if (feedback.status === 'partial') {
                    cellClass = 'cell-partial';
                } else {
                    // All wrong cases (including weight with arrows) use cell-wrong (red)
                    cellClass = 'cell-wrong';
                }
                
                // Add arrows for weight (even when wrong)
                if (feedback.status.includes('arrow-up')) {
                    displayText += ' ↑';
                } else if (feedback.status.includes('arrow-down')) {
                    displayText += ' ↓';
                }
                
                cell.textContent = displayText;
                cell.className = cellClass;
            } else {
                cell.textContent = 'Unknown';
                cell.className = 'cell-wrong';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    historyContainer.appendChild(tableContainer);
    
    // Auto-scroll to top to show the newest guess
    historyContainer.scrollTop = 0;
}

function displayCharacterAttributes(characterName) {
    const character = characters[characterName];
    const messageElement = document.getElementById('gameMessage');
    
    // Create attributes table
    const table = document.createElement('table');
    table.className = 'feedback-table';
    table.style.marginTop = '20px';
    
    // Create header row
    const headerRow = document.createElement('tr');
    const attributeHeader = document.createElement('th');
    attributeHeader.textContent = 'Attribute';
    attributeHeader.colSpan = 2;
    attributeHeader.style.textAlign = 'center';
    headerRow.appendChild(attributeHeader);
    table.appendChild(headerRow);
    
    // Add character image and name at the top
    const imageRow = document.createElement('tr');
    const imageCell = document.createElement('td');
    imageCell.colSpan = 2;
    imageCell.style.textAlign = 'center';
    imageCell.style.padding = '15px';
    
    if (character.image) {
        const img = document.createElement('img');
        img.src = `../../assets/pics/${character.image}`;
        img.alt = characterName;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '10px';
        img.style.border = '3px solid rgba(76, 201, 240, 0.5)';
        img.onerror = function() {
            this.style.display = 'none';
        };
        imageCell.appendChild(img);
    }
    
    const nameDisplay = document.createElement('h3');
    nameDisplay.textContent = characterName;
    nameDisplay.style.color = '#4cc9f0';
    nameDisplay.style.margin = '10px 0 5px 0';
    imageCell.appendChild(nameDisplay);
    
    imageRow.appendChild(imageCell);
    table.appendChild(imageRow);
    
    // Add attribute rows (removed level)
    const attributeOrder = [
        'gender', 'type', 'race', 'class', 'role', 
        'firstAppearance', 'size', 'weight'
    ];
    
    attributeOrder.forEach(attr => {
        if (character[attr]) {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = formatAttributeName(attr);
            nameCell.style.fontWeight = 'bold';
            nameCell.style.background = 'rgba(76, 201, 240, 0.2)';
            
            const valueCell = document.createElement('td');
            valueCell.textContent = character[attr];
            valueCell.className = 'cell-correct';
            
            row.appendChild(nameCell);
            row.appendChild(valueCell);
            table.appendChild(row);
        }
    });
    
    // Add to message
    const attributesTitle = document.createElement('div');
    attributesTitle.innerHTML = '<br><strong>Character Attributes:</strong>';
    messageElement.appendChild(attributesTitle);
    messageElement.appendChild(table);
} 

// New game function
function newGame() {
    initGame();
}

// Click outside to close search results
document.addEventListener('click', function(e) {
    const searchResults = document.getElementById('searchResults');
    const searchInput = document.getElementById('characterSearch');
    
    if (e.target !== searchInput && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Initialize when page loads
window.onload = function() {
    // Disable input until data is loaded
    document.getElementById('characterSearch').disabled = true;
    document.getElementById('guessButton').disabled = true;
    updateGameMessage('Loading character data...', 'info');
    
    loadCharacterData();
};