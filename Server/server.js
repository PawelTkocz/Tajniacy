var http = require('http');
var socket = require('socket.io');
var express = require('express');
var fs = require('fs');

var app = express();

app.set('view engine', 'ejs');
app.set('views', '../Client');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("../Static"));


var server = http.createServer(app);
var io = socket(server);

const { initGame, makeRoomId } = require('./game');
const { PLAYERS_NUMBER, GRID_SIZE } = require('./constants');

// mechanizm pokoi
var points = [];
var owners = [];
var players = [];

app.get('/', function (req, res) {
    res.render('index', { gridSize: GRID_SIZE, login: '', message: '' });
});

app.get('/rooms', (req, res) => {
    res.render('rooms', { points, owners, players });
});

//mechanizm logowania
var users = [];
var passwords = [];
var games_won_cnt = [];
var games_cnt = [];

function loadUserData() {
    try {
        const data = fs.readFileSync('userdata.json', 'utf8');
        const parsedData = JSON.parse(data);
        users = parsedData.users || [];
        passwords = parsedData.passwords || [];
        games_won_cnt = parsedData.games_won_cnt || [];
        games_cnt = parsedData.games_cnt || [];
    }
    catch (err) {
        console.error('Error reading user data from file:', err.message);
    }
}

function saveUserData() {
    const userData = { users, passwords, games_won_cnt, games_cnt };
    const jsonData = JSON.stringify(userData, null, 2);

    fs.writeFileSync('userdata.json', jsonData, 'utf8');
}

loadUserData();

app.get('/logowanie', (req, res) => {
    res.render('logowanie', { nick: '', password: '' });
});

app.post('/logowanie', (req, res) => {
    let pom = 0;
    let username = '';
    for (let i = 0; i < users.length; i++) {
        if (users[i] == req.body.nick && passwords[i] == req.body.password) {
            pom = 1;
            username = users[i];
            break;
        }
    }
    if (pom == 1) {
        res.render('index', { gridSize: GRID_SIZE, login: username, message: 'Zalogowano' });
    }
    else {
        res.render('index', { gridSize: GRID_SIZE, login: username, message: 'Błędne hasło' });
    }

});

app.post('/rejestracja', (req, res) => {
    let pom = 0;
    for (let i = 0; i < users.length; i++) {
        if (users[i] == req.body.nick) {
            pom = 1;
            break;
        }
    }
    if (pom == 1)
        res.render('index', { gridSize: GRID_SIZE, login: '', message: 'Użytkownik o takim loginie już istnieje' });
    else {
        users.push(req.body.nick);
        passwords.push(req.body.password);
        games_won_cnt.push(0);
        games_cnt.push(0);
        try {
            saveUserData();
            res.render('index', { gridSize: GRID_SIZE, login: req.body.nick, message: 'Zarejestrowano' });
        }
        catch (err) {
            console.error('Error saving user data:', err.message);
            res.render('index', { gridSize: GRID_SIZE, login: '', message: 'Błąd podczas zapisywania danych' });
        }
    }

});

app.get('/rejestracja', (req, res) => {
    res.render('rejestracja');
});

const roomState = {};
const playersCurrentRoom = {};

let turn;
let question;

io.on('connection', function (playerSocket) {
    playerSocket.on('newGame', handleNewGame);
    playerSocket.on('joinGame', handleJoinGame);
    playerSocket.on('giveDescription', handleDescription);
    playerSocket.on('guessAgent', handleGuess);
    playerSocket.on('chooseTeam', handleChooseTeam);
    playerSocket.on('startGame', handleStartGame);
    playerSocket.on('blackClicked', finishGame);
    playerSocket.on('wrongGuess', QuestionToZero);

    function handleJoinGame(roomId, username) {
        if (!io.sockets.adapter.rooms.has(roomId)) {
            playerSocket.emit('unknownGameCode');
            return;
        }

        if (username == '' || username == null) {
            playerSocket.emit('unknownUsername');
            return;
        }

        let room = io.sockets.adapter.rooms.get(roomId);
        let roomPlayersNumber = room.size;
        if (roomPlayersNumber >= PLAYERS_NUMBER) {
            playerSocket.emit('tooManyPlayers');
            return;
        }
        roomState[roomId].SocketsToUsernames[playerSocket.id] = username;
        // zwiększam liczbę graczy w danym pokoju
        for (let i = 0; i < points.length; i++)
            if (points[i] == roomId)
                players[i]++;

        playersCurrentRoom[playerSocket.id] = roomId;
        playerSocket.join(roomId);
        playerSocket.emit('gameCode', roomId);
        io.sockets.in(roomId).emit('waitingPlayers', roomPlayersNumber + 1);

        if (roomPlayersNumber == PLAYERS_NUMBER - 1) {
            io.sockets.in(roomId).emit('chooseTeams');
        }
        else {
            playerSocket.emit('waitForGame');
        }
    }

    function handleNewGame(username) {
        if (username == '' || username == null) {
            playerSocket.emit('unknownUsername');
            return;
        }
        let roomId = makeRoomId();
        playersCurrentRoom[playerSocket.id] = roomId;
        points.push(roomId);
        owners.push(username);
        players.push(1);
        playerSocket.emit('gameCode', roomId);
        playerSocket.emit('waitingPlayers', 1);
        playerSocket.emit('waitForGame');
        roomState[roomId] = initGame();
        roomState[roomId].SocketsToUsernames[playerSocket.id] = username;
        playerSocket.join(roomId);
    }

    function handleDescription(description, number) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log(description, number);
        io.sockets.in(roomId).emit('newDescription', description, number);
        question = parseInt(number) + 1;
        const state = roomState[roomId];

        state.rolesToSockets['redChef'].emit('updateSendButtonsVisibility', false);
        state.rolesToSockets['blueChef'].emit('updateSendButtonsVisibility', false);
        state.rolesToSockets[turn == 'blue' ? 'blueAgent' : 'redAgent'].emit('updateButtonsVisibility', GRID_SIZE, true, state.revealedIdentities);
    }

    function handleChooseTeam(role) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];

        if (state.rolesToPlayers[role] == null) {
            if (playerSocket.id in state.playersToRoles && state.playersToRoles[playerSocket.id] != null) {
                io.sockets.in(roomId).emit('changeTeam', state.playersToRoles[playerSocket.id], null);
                state.rolesToPlayers[state.playersToRoles[playerSocket.id]] = null;
            }
            state.rolesToPlayers[role] = playerSocket.id;
            state.rolesToSockets[role] = playerSocket;
            state.playersToRoles[playerSocket.id] = role;
            io.sockets.in(roomId).emit('changeTeam', role, state.SocketsToUsernames[playerSocket.id]);
            if (Object.keys(state.playersToRoles).length == PLAYERS_NUMBER)
                io.sockets.in(roomId).emit('showStartBtn', true);
        }
        else if (state.rolesToPlayers[role] == playerSocket.id) {
            io.sockets.in(roomId).emit('changeTeam', state.playersToRoles[playerSocket.id], null);
            state.rolesToPlayers[role] = null;
            state.playersToRoles[playerSocket.id] = null;
            io.sockets.in(roomId).emit('showStartBtn', false);
        }
    }

    function handleStartGame() {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];
        io.sockets.in(roomId).emit('initWords', state.words, GRID_SIZE);
        state.rolesToSockets['blueChef'].emit('initAgentsIdentities', state.agentsIdentities, GRID_SIZE);
        state.rolesToSockets['redChef'].emit('initAgentsIdentities', state.agentsIdentities, GRID_SIZE);
        state.rolesToSockets['blueChef'].emit('updateDescriptionsVisibility', true);
        state.rolesToSockets['blueChef'].emit('setBackgroundColor', true);
        state.rolesToSockets['blueAgent'].emit('setBackgroundColor', true);
        state.rolesToSockets['redChef'].emit('setBackgroundColor', false);
        state.rolesToSockets['redAgent'].emit('setBackgroundColor', false);
        io.sockets.in(roomId).emit('startGame');
        state.rolesToSockets['blueChef'].emit('updateSendButtonsVisibility', true);
        turn = 'blue';
    }

    function handleGuess(position) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];
        console.log(position);
        io.sockets.in(roomId).emit('turnOffButton', position, state.agentsIdentities[position[0]][position[1]]);
        state.revealedIdentities[position[0]][position[1]] = state.agentsIdentities[position[0]][position[1]];
        if (state.agentsIdentities[position[0]][position[1]] == 1) {
            if (turn != 'blue') {
                QuestionToZero();
            }
        } else if (state.agentsIdentities[position[0]][position[1]] == 2) {
            if (turn != 'red') {
                QuestionToZero();
            }
        } else if (state.agentsIdentities[position[0]][position[1]] == 3) {
            finishGame(turn == 'blue' ? 'red' : 'blue');
        } else if (state.agentsIdentities[position[0]][position[1]] == 0) {
            QuestionToZero();
        }
        question--;
        if (question == 0) {
            QuestionToZero();
        }

        const revealedIdentities = Array.isArray(state.revealedIdentities) ? state.revealedIdentities.reduce((acc, val) => acc.concat(val), []) : [];
        const onesCount = revealedIdentities.filter(identity => identity === 1).length;
        const twosCount = revealedIdentities.filter(identity => identity === 2).length;
        if (onesCount === 8) {
            finishGame('blue');
        } else if (twosCount === 7) {
            finishGame('red');
        }

        io.sockets.in(roomId).emit('newGuess', position, state.agentsIdentities, turn);
    }

    function QuestionToZero() {
        question = 0;
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];
        if (question == 0) {
            turn = turn == 'blue' ? 'red' : 'blue';
            state.rolesToSockets['blueAgent'].emit('updateButtonsVisibility', GRID_SIZE, false, state.revealedIdentities);
            state.rolesToSockets['redAgent'].emit('updateButtonsVisibility', GRID_SIZE, false, state.revealedIdentities);
            state.rolesToSockets['blueChef'].emit('updateDescriptionsVisibility', turn == 'blue' ? true : false);
            state.rolesToSockets['redChef'].emit('updateDescriptionsVisibility', turn == 'red' ? true : false);
            state.rolesToSockets['blueAgent'].emit('updateDescriptionsVisibility', false);
            state.rolesToSockets['redAgent'].emit('updateDescriptionsVisibility', false);
            state.rolesToSockets['blueChef'].emit('updateSendButtonsVisibility', turn == 'blue' ? true : false);
            state.rolesToSockets['redChef'].emit('updateSendButtonsVisibility', turn == 'red' ? true : false);
        }
    }

    function finishGame(winner) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log("FINISH GAME");
        io.sockets.in(roomId).emit('gameOver', winner);
        roomState[roomId] = null;
    }
});

server.listen(3000);
console.log('server listens');
