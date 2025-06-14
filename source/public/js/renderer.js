document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const preferencesModal = document.getElementById('preferences-modal');
    const langSelect = document.getElementById('lang-select');
    const themeSelect = document.getElementById('theme-select');
    const savePreferencesBtn = document.getElementById('save-preferences-btn');

    const scanModal = document.getElementById('scan-modal');
    const scanYesBtn = document.getElementById('scan-yes-btn');
    const scanNoBtn = document.getElementById('scan-no-btn');

    const gamesList = document.getElementById('games-list');
    const noGamesMessage = document.getElementById('no-games-message');
    const editGamesBtn = document.getElementById('edit-games-btn');
    const searchInput = document.getElementById('search-input'); // Assuming searchInput exists in index.html

    // NEW: Window control buttons
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const closeBtn = document.getElementById('close-btn');

    // NEW: Game Detail Modal elements
    const gameDetailModal = document.getElementById('game-detail-modal');
    const gameDetailContent = document.getElementById('game-detail-content');
    const closeDetailModalBtn = document.getElementById('close-detail-modal');

    // Data holders
    let currentPreferences = {};
    let currentGames = { games: [] }; // All games loaded
    let displayedGames = { games: [] }; // Games currently shown (after search/filter)

    // Fetch initial data
    const { preferences, games, isFirstRun } = await window.api.getInitialData();
    currentPreferences = preferences;
    currentGames = games;
    displayedGames = currentGames; // Initially, all games are displayed

    // --- Utility Functions ---

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('bg-gray-900', 'text-white');
            document.body.classList.remove('bg-gray-100', 'text-gray-900');
        } else if (theme === 'light') {
            document.body.classList.add('bg-gray-100', 'text-gray-900');
            document.body.classList.remove('bg-gray-900', 'text-white');
        } else { // System default, assuming dark for now if system is dark or no specific preference
            document.body.classList.add('bg-gray-900', 'text-white');
            document.body.classList.remove('bg-gray-100', 'text-gray-900');
        }
    };

    const renderGames = (gamesDataToRender) => {
        gamesList.innerHTML = ''; // Clear existing games
        if (gamesDataToRender.games && gamesDataToRender.games.length > 0) {
            noGamesMessage.classList.add('hidden');
            gamesDataToRender.games.forEach((game, index) => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col transform transition-transform duration-200 hover:scale-105 cursor-pointer'; // Added game-card class and hover effect
                gameCard.dataset.gameIndex = index; // Store index for click event
                gameCard.innerHTML = `
                    <div class="w-full h-40 bg-gray-700 flex items-center justify-center">
                        <img src="${game.coverArt || 'https://via.placeholder.com/150/4B5563/FFFFFF?text=No+Cover'}" alt="${game.name} Cover" class="w-full h-full object-cover">
                    </div>
                    <div class="p-4 flex-grow flex flex-col">
                        <h3 class="text-xl font-semibold mb-2">${game.name}</h3>
                        <p class="text-gray-400 text-sm flex-grow mb-3 truncate">${game.path}</p>
                        <div class="mt-auto">
                            ${game.launch && game.launch.length > 0 ?
                                `<select data-game-index="${index}" class="launch-option-select w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-md text-white mb-2">
                                    ${game.launch.map(opt => `<option value="${opt.command}">${opt.type}</option>`).join('')}
                                </select>` :
                                '<p class="text-gray-500 text-sm">No launch options</p>'
                            }
                            <button data-game-index="${index}" class="launch-game-btn w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Launch Game</button>
                        </div>
                    </div>
                `;
                gamesList.appendChild(gameCard);
            });
            // Attach event listeners for launch buttons
            document.querySelectorAll('.launch-game-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevent card click from firing
                    const gameIndex = parseInt(event.target.dataset.gameIndex);
                    const game = displayedGames.games[gameIndex]; // Use displayedGames
                    if (!game || !game.launch || game.launch.length === 0) {
                        alert('No launch options available for this game.');
                        return;
                    }

                    const selectElement = event.target.previousElementSibling; // The select dropdown
                    const selectedCommand = selectElement.value;

                    const result = await window.api.launchGame(selectedCommand);
                    if (result.success) {
                        console.log(`Launched ${game.name} using: ${selectedCommand}`);
                    } else {
                        alert(`Failed to launch ${game.name}: ${result.message}`);
                    }
                });
            });

            // Attach event listeners for game card clicks (for game detail page)
            document.querySelectorAll('.game-card').forEach(card => {
                card.addEventListener('click', showGameDetail);
            });

        } else {
            noGamesMessage.classList.remove('hidden');
        }
    };

    // Search functionality (re-renders displayedGames)
    const filterGames = () => {
        // Check if searchInput exists before accessing its value
        if (searchInput) {
            const searchTerm = searchInput.value.toLowerCase();
            displayedGames.games = currentGames.games.filter(game =>
                game.name.toLowerCase().includes(searchTerm) ||
                game.path.toLowerCase().includes(searchTerm)
            );
            renderGames(displayedGames);
        }
    };

    // NEW: Function to show game detail modal
    const showGameDetail = (event) => {
        const gameIndex = parseInt(event.currentTarget.dataset.gameIndex);
        const game = currentGames.games[gameIndex]; // Get game from currentGames (full list)

        if (game) {
            gameDetailContent.innerHTML = `
                <div class="relative w-full h-64 bg-gray-700 flex items-center justify-center overflow-hidden rounded-md mb-4">
                    <img src="${game.coverArt || 'https://via.placeholder.com/600/4B5563/FFFFFF?text=No+Banner'}" alt="${game.name} Banner" class="w-full h-full object-cover">
                    <h2 class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent text-white p-4 font-bold text-xl">${game.name}</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-semibold text-lg mb-2">Launch Options</h3>
                        ${game.launch && game.launch.length > 0 ?
                            game.launch.map(opt => `<button class="detail-launch-btn block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2" data-launch-command="${opt.command}">${opt.type} - Launch</button>`).join('') :
                            '<p class="text-gray-500">No launch options available.</p>'
                        }
                    </div>
                    <div>
                        <h3 class="font-semibold text-lg mb-2">Details</h3>
                        <p class="text-gray-400 mb-2"><strong>Path:</strong> <span class="text-gray-500 text-sm">${game.path}</span></p>
                        <p class="text-gray-400 mb-2"><strong>Last Launched:</strong> <span class="text-gray-500 text-sm">Not yet tracked</span></p>
                        <p class="text-gray-400 mb-2"><strong>Usage Time:</strong> <span class="text-gray-500 text-sm">Not yet tracked</span></p>
                        </div>
                </div>
            `;
            gameDetailModal.classList.remove('hidden');

            // Add event listeners to the launch buttons inside the modal
            gameDetailContent.querySelectorAll('.detail-launch-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const command = event.currentTarget.dataset.launchCommand;
                    const result = await window.api.launchGame(command);
                    if (result.success) {
                        console.log(`Launched ${game.name} using: ${command}`);
                        gameDetailModal.classList.add('hidden'); // Close modal on successful launch
                    } else {
                        alert(`Failed to launch ${game.name}: ${result.message}`);
                    }
                });
            });
        }
    };

    closeDetailModalBtn.addEventListener('click', () => {
        gameDetailModal.classList.add('hidden');
    });

    // --- Initial Setup & Event Listeners ---

    // Initial setup based on first run or existing preferences
    if (isFirstRun) {
        preferencesModal.classList.remove('hidden');
    } else {
        applyTheme(currentPreferences.theme);
        langSelect.value = currentPreferences.lang || 'en-us';
        themeSelect.value = currentPreferences.theme;
        renderGames(displayedGames); // Render initial games
    }

    // Event Listeners for Modals and Buttons
    savePreferencesBtn.addEventListener('click', async () => {
        currentPreferences.lang = langSelect.value;
        currentPreferences.theme = themeSelect.value;
        await window.api.savePreferences(currentPreferences);
        applyTheme(currentPreferences.theme);
        preferencesModal.classList.add('hidden');
        scanModal.classList.remove('hidden');
    });

    scanYesBtn.addEventListener('click', async () => {
        scanModal.classList.add('hidden');
        await window.api.openEditorWindow();
    });

    scanNoBtn.addEventListener('click', async () => {
        scanModal.classList.add('hidden');
        await window.api.openEditorWindow();
    });

    editGamesBtn.addEventListener('click', async () => {
        await window.api.openEditorWindow();
    });

    // NEW: Event listeners for window controls
    minimizeBtn.addEventListener('click', () => {
        window.api.minimizeWindow();
    });

    maximizeBtn.addEventListener('click', async () => {
        await window.api.maximizeUnmaximizeWindow();
        const maximizeIcon = maximizeBtn.querySelector('i');
        // This is a simplified toggle based on click. For true state, main process
        // would need to send an IPC event back to renderer when state changes.
        if (maximizeIcon.textContent === 'crop_square') {
            maximizeIcon.textContent = 'fullscreen_exit';
        } else {
            maximizeIcon.textContent = 'crop_square';
        }
    });

    closeBtn.addEventListener('click', () => {
        window.api.closeWindow();
    });

    // Event listener for search input (assuming searchInput element exists)
    if (searchInput) {
        searchInput.addEventListener('input', filterGames);
    }
});