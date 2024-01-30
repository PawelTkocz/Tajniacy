const { GRID_SIZE, AGENTS_NUMBER, ROOM_ID_LENGTH } = require('./constants');
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

module.exports = {
    initGame,
    makeRoomId
}

function initGame() {
    let generatedWords = [
        ['kot', 'liść', 'klawiatura', 'palec', 'wieża'],
        ['kolano', 'pies', 'korona', 'krasnal', 'plastik'],
        ['egzamin', 'poduszka', 'dom', 'łyżwa', 'mięsień'],
        ['zeszyt', 'ściąga', 'prezent', 'zlew', 'śnieg'],
        ['Egipt', 'karton', 'bramka', 'hasło', 'igła']
    ];
    let agentsIdentities = [
        [1, 1, 1, 2, 0],
        [0, 2, 1, 0, 0],
        [1, 2, 3, 0, 0],
        [0, 0, 0, 2, 1],
        [2, 1, 1, 2, 2]
    ];
    let revealedIdentities = [
        [0, 0, 1, 1, 1],
        [1, 1, 1, 0, 1],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 1, 1],
        [1, 0, 1, 1, 0]
    ]; 

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
        playersToRoles: {},
        words: generatedWords, 
        agentsIdentities: agentsIdentities,
        revealedIdentities: revealedIdentities,
        gridsize: GRID_SIZE,
        currentTurn: 1
    };
}

function makeRoomId() {
    let roomId = '';
    let charsLen = chars.length;
    for(let i = 0; i < ROOM_ID_LENGTH; i++) {
        let pos = Math.floor(Math.random() * charsLen);
        roomId += chars.charAt(pos);
    }
    return roomId;
}
