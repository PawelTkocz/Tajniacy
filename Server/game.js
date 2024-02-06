const { GRID_SIZE, AGENTS_NUMBER, ROOM_ID_LENGTH } = require('./constants');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

module.exports = {
    initGame,
    makeRoomId
}

function generateUniqueWords(filePath, gridSize) {
    const fs = require('fs');
    const words = fs.readFileSync(filePath, 'utf-8').split('\n');
    const grid = [];

    if (words.length < gridSize * gridSize) {
        throw new Error('Insufficient words in the file');
    }

    const usedIndices = new Set();

    for (let i = 0; i < gridSize; i++) {
        const row = [];
        for (let j = 0; j < gridSize; j++) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * words.length);
            } while (usedIndices.has(randomIndex));
            usedIndices.add(randomIndex);
            row.push(words[randomIndex]);
        }
        grid.push(row);
    }

    return grid;
}

function generateAgentsIdentities(GRID_SIZE) {
    const agentsIdentities = [];
    const totalCells = GRID_SIZE * GRID_SIZE;
    const onesCount = 8;
    const twosCount = 7;
    const threesCount = 1;
    const zerosCount = totalCells - onesCount - twosCount - threesCount;

    const identities = [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3];
    for (let i = 0; i < zerosCount; i++) {
        identities.push(0);
    }

    for (let i = identities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [identities[i], identities[j]] = [identities[j], identities[i]];
    }

    for (let i = 0; i < GRID_SIZE; i++) {
        const row = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            row.push(identities[i * GRID_SIZE + j]);
        }
        agentsIdentities.push(row);
    }

    return agentsIdentities;
}

function initGame() {
    let generatedWords = generateUniqueWords('../Static/words.txt', GRID_SIZE);
    let agentsIdentities = generateAgentsIdentities(GRID_SIZE);

    // let revealedIdentities = [
    //     [0, 0, 1, 1, 1],
    //     [1, 1, 1, 0, 1],
    //     [0, 0, 0, 1, 0],
    //     [0, 0, 0, 1, 1],
    //     [1, 0, 1, 1, 0]
    // ];

    return {
        teams: [{
            agentsLeft: AGENTS_NUMBER + 1
        }, {
            agentsLeft: AGENTS_NUMBER
        }],
        rolesToPlayers: {
            blueChef: null,
            redChef: null,
            blueAgent: null,
            redAgent: null,
        },
        rolesToSockets: {
            blueChef: null,
            redChef: null,
            blueAgent: null,
            redAgent: null,
        },
        SocketsToUsernames: {},
        playersToRoles: {},
        words: generatedWords,
        agentsIdentities: agentsIdentities,
        // revealedIdentities: revealedIdentities,
        gridsize: GRID_SIZE,
        currentTurn: 1
    };
}

function makeRoomId() {
    let roomId = '';
    let charsLen = chars.length;
    for (let i = 0; i < ROOM_ID_LENGTH; i++) {
        let pos = Math.floor(Math.random() * charsLen);
        roomId += chars.charAt(pos);
    }
    return roomId;
}
