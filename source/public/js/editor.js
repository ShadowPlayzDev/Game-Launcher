document.addEventListener('DOMContentLoaded', async () => {
    console.log('editor.js: DOMContentLoaded event fired. Script is running.');

    const addGameForm = document.getElementById('add-game-form');
    const gameNameInput = document.getElementById('game-name');
    const gamePathInput = document.getElementById('game-path');
    const gameCoverArtInput = document.getElementById('game-coverart');

    const gamesTableBody = document.getElementById('games-table-body');
    const noGamesEditorMessage = document.getElementById('no-games-editor-message');
    const scanGamesBtn = document.getElementById('scan-games-btn');
    console.log('editor.js: Attempting to get element by ID "scan-games-btn". Result:', scanGamesBtn);
    const scanStatusMessage = document.getElementById('scan-status-message');

    const launchOptionsContainer = document.getElementById('launch-options-container');
    const addLaunchOptionBtn = document.getElementById('add-launch-option-btn');

    let gamesData = { games: [] };
    console.log('editor.js: Initial gamesData state:', JSON.stringify(gamesData));

    const loadGames = async () => {
        console.log('editor.js: Calling window.api.readGamesData() to load games...');
        try {
            gamesData = await window.api.readGamesData();
            console.log('editor.js: Games data loaded:', JSON.stringify(gamesData));
            renderGamesTable();
        } catch (error) {
            console.error('editor.js: Error loading games data:', error);
        }
    };

    const renderGamesTable = () => {
        console.log('editor.js: Rendering games table with data:', JSON.stringify(gamesData));
        gamesTableBody.innerHTML = '';
        if (gamesData.games && gamesData.games.length > 0) {
            noGamesEditorMessage.classList.add('hidden');
            gamesData.games.forEach((game, index) => {
                const row = gamesTableBody.insertRow();
                row.className = 'border-b border-gray-600 last:border-b-0';
                row.innerHTML = `
                    <td class="px-4 py-2">${game.name}</td>
                    <td class="px-4 py-2 text-sm text-gray-400">${game.path}</td>
                    <td class="px-4 py-2">
                        ${game.coverArt ? `<img src="${game.coverArt}" alt="Cover" class="w-12 h-12 object-cover rounded">` : 'N/A'}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-400">
                        ${game.launch && game.launch.length > 0 ?
                            game.launch.map(opt => `<div><strong>${opt.type}:</strong> ${opt.command}</div>`).join('') :
                            'No options'
                        }
                    </td>
                    <td class="px-4 py-2">
                        <button class="delete-game-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded" data-index="${index}">Delete</button>
                    </td>
                `;
            });
            document.querySelectorAll('.delete-game-btn').forEach(button => {
                button.addEventListener('click', deleteGame);
            });
        } else {
            noGamesEditorMessage.classList.remove('hidden');
            console.log('editor.js: No games found, showing "No games" message.');
        }
    };

    const displayScanMessage = (message, isSuccess) => {
        console.log(`editor.js: Displaying scan message: "${message}" (Success: ${isSuccess})`);
        scanStatusMessage.textContent = message;
        scanStatusMessage.classList.remove('hidden', 'bg-green-700', 'bg-red-700');
        if (isSuccess) {
            scanStatusMessage.classList.add('bg-green-700');
        } else {
            scanStatusMessage.classList.add('bg-red-700');
        }
        setTimeout(() => {
            scanStatusMessage.classList.add('hidden');
        }, 5000);
    };

    const addLaunchOptionFields = () => {
        console.log('editor.js: "Add Another Launch Option" button clicked. Adding new fields...');
        const newOptionGroup = document.createElement('div');
        newOptionGroup.className = 'launch-option-item grid grid-cols-1 md:grid-cols-5 gap-4 items-end';
        newOptionGroup.innerHTML = `
            <div class="md:col-span-2">
                <label class="block text-gray-400 text-sm font-bold mb-2">Type (e.g., Epic Games, Steam):</label>
                <input type="text" class="launch-type shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" required>
            </div>
            <div class="md:col-span-3">
                <label class="block text-gray-400 text-sm font-bold mb-2">Command (e.g., com.epicgames.launcher://... or C:\\game.exe):</label>
                <input type="text" class="launch-command shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 border-gray-600" required>
            </div>
            <button type="button" class="remove-launch-option-btn mt-2 md:mt-0 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded">X</button>
        `;
        launchOptionsContainer.appendChild(newOptionGroup);
        console.log('editor.js: New launch option fields added to DOM.');

        newOptionGroup.querySelector('.remove-launch-option-btn').addEventListener('click', (e) => {
            console.log('editor.js: Remove launch option button clicked.');
            e.target.closest('.launch-option-item').remove();
        });
    };

    const addGame = async (event) => {
        event.preventDefault();
        console.log('editor.js: "Add Game" form submitted. Starting addGame function.');

        const launchOptions = [];
        document.querySelectorAll('.launch-option-item').forEach((group, index) => {
            const typeInput = group.querySelector('.launch-type');
            const commandInput = group.querySelector('.launch-command');
            console.log(`editor.js: Reading launch option group ${index}: Type="${typeInput.value.trim()}", Command="${commandInput.value.trim()}"`);
            if (typeInput && commandInput && typeInput.value.trim() !== '' && commandInput.value.trim() !== '') {
                launchOptions.push({
                    type: typeInput.value.trim(),
                    command: commandInput.value.trim()
                });
            } else {
                console.warn(`editor.js: Skipping launch option group ${index} due to empty fields.`);
            }
        });
        console.log('editor.js: Collected launch options:', JSON.stringify(launchOptions));

        if (gameNameInput.value.trim() === '' || gamePathInput.value.trim() === '') {
            console.warn('editor.js: Validation failed: Game Name or Game Path is empty.');
            alert('Please fill in Game Name and Game Path.');
            return;
        }

        if (launchOptions.length === 0) {
            console.warn('editor.js: Validation failed: No valid launch options provided.');
            alert('Please add at least one valid Launch Option (Type and Command).');
            return;
        }

        const newGame = {
            name: gameNameInput.value.trim(),
            path: gamePathInput.value.trim(),
            coverArt: gameCoverArtInput.value.trim() || undefined,
            launch: launchOptions
        };
        console.log('editor.js: New game object to be added:', JSON.stringify(newGame));

        gamesData.games.push(newGame);
        console.log('editor.js: gamesData after adding new game (before save):', JSON.stringify(gamesData));
        
        try {
            const saveResult = await window.api.saveGamesData(gamesData);
            console.log('editor.js: window.api.saveGamesData() call completed. Result:', saveResult);
            await loadGames();
            console.log('editor.js: loadGames() called after saving.');
        } catch (error) {
            console.error('editor.js: Error during save or loadGames after save:', error);
        }

        addGameForm.reset();
        console.log('editor.js: Form reset.');
        
        while (launchOptionsContainer.children.length > 1) {
            launchOptionsContainer.removeChild(launchOptionsContainer.lastChild);
        }
        const initialTypeInput = launchOptionsContainer.querySelector('.launch-type');
        const initialCommandInput = launchOptionsContainer.querySelector('.launch-command');
        if (initialTypeInput) initialTypeInput.value = 'Default Launch';
        if (initialCommandInput) initialCommandInput.value = '';
        console.log('editor.js: Launch options container reset.');
    };

    const deleteGame = async (event) => {
        console.log('editor.js: "Delete Game" button clicked.');
        const indexToDelete = parseInt(event.target.dataset.index);
        console.log('editor.js: Deleting game at index:', indexToDelete);
        gamesData.games.splice(indexToDelete, 1);
        try {
            const saveResult = await window.api.saveGamesData(gamesData);
            console.log('editor.js: Save after delete completed. Result:', saveResult);
            await loadGames();
            console.log('editor.js: loadGames() called after delete.');
        } catch (error) {
            console.error('editor.js: Error during delete save or loadGames:', error);
        }
    };

    scanGamesBtn.addEventListener('click', async () => {
        console.log('editor.js: "Scan Games" button clicked. Calling window.api.scanDefaultGameDirs()...');
        try {
            const result = await window.api.scanDefaultGameDirs();
            console.log('editor.js: scanDefaultGameDirs() result:', result);
            if (result.success) {
                displayScanMessage(result.message, true);
                await loadGames();
            } else {
                displayScanMessage(`Error: ${result.message}`, false);
            }
        } catch (error) {
            console.error('editor.js: Error during scanDefaultGameDirs:', error);
            displayScanMessage(`Error calling scanDefaultGameDirs: ${error.message}`, false);
        }
    });

    addLaunchOptionBtn.addEventListener('click', addLaunchOptionFields);
    console.log('editor.js: Event listener for addLaunchOptionBtn attached.');

    addGameForm.addEventListener('submit', addGame);
    console.log('editor.js: Event listener for addGameForm submit attached.');

    loadGames();
    console.log('editor.js: Initial loadGames() call made.');
});