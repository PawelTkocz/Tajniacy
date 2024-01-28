const { GRID_SIZE, AGENTS_NUMBER } = require('./constants');

module.exports = {
    initGame,
    gameLoop,
}

function initGame() {
    //generować GRID_SIZE x GRID_SIZE
    let generatedWords = [
        ['raz', 'dwa', 'trzy', 'cztery', 'pięć'],
        ['sześć', 'siedem', 'osiem', 'dziewięć', 'dziesięć'],
        ['11', '12', '13', '14', '15'],
        ['16', '17', '18', '19', '20'],
        ['21', '22', '23', '24', '25']
    ];
    //losować agentow drużyn i killera
    let generatedAgentsTeams = [
        [0, 2, 2, 2, 0],
        [1, 0, 2, 3, 1],
        [1, 1, 1, 1, 1],
        [1, 0, 2, 0, 1],
        [0, 2, 2, 2, 0]
    ];    


    return {
        teams: [{
            agentsLeft: AGENTS_NUMBER + 1
        }, {
            agentsLeft: AGENTS_NUMBER
        }],
        words: generatedWords, 
        agentsTeams: generatedAgentsTeams,
        gridsize: GRID_SIZE,
        currentTurn: 1
    };
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    //zmienia pozycje węża
    //zwraca numer gracza jesli ktorys wygrał
    //false wpp
    return false;
}