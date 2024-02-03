var http = require('http');
var socket = require('socket.io');
var express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.set('views', '../Client');

app.use( express.static( "../Static" ) );

var server = http.createServer(app);
var io = socket(server);

const { initGame, makeRoomId } = require('./game');
const { PLAYERS_NUMBER, GRID_SIZE } = require('./constants');

app.get('/', function(req, res) {
    res.render('index', {gridSize: GRID_SIZE});
});

const roomState = {};
const playersCurrentRoom = {};

let turn;
let question;

io.on('connection', function(playerSocket) {
    playerSocket.on('newGame', handleNewGame);
    playerSocket.on('joinGame', handleJoinGame);
    playerSocket.on('giveDescription', handleDescription);
    playerSocket.on('guessAgent', handleGuess);
    playerSocket.on('pass', handlePass);
    playerSocket.on('chooseTeam', handleChooseTeam);
    playerSocket.on('startGame', handleStartGame);
    playerSocket.on('blackClicked', finishGame);
    playerSocket.on('wrongGuess', QuestionToZero);

    function handleJoinGame(roomId) {
        if(!io.sockets.adapter.rooms.has(roomId)){
            playerSocket.emit('unknownGameCode');
            return;
        }

        let room = io.sockets.adapter.rooms.get(roomId);
        let roomPlayersNumber = room.size;
        if(roomPlayersNumber >= PLAYERS_NUMBER) {
            playerSocket.emit('tooManyPlayers');
            return;
        }

        playersCurrentRoom[playerSocket.id] = roomId;
        playerSocket.join(roomId);
        playerSocket.emit('gameCode', roomId);
        io.sockets.in(roomId).emit('waitingPlayers', roomPlayersNumber+1);

        if(roomPlayersNumber == PLAYERS_NUMBER-1){
            io.sockets.in(roomId).emit('chooseTeams');
        }
        else{
            playerSocket.emit('waitForGame');
        }
    }

    function handleNewGame(){
        let roomId = makeRoomId();
        playersCurrentRoom[playerSocket.id] = roomId;
        playerSocket.emit('gameCode', roomId);
        playerSocket.emit('waitingPlayers', 1);
        playerSocket.emit('waitForGame');
        roomState[roomId] = initGame();
        playerSocket.join(roomId);
    }

    function handleDescription(description, number) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log(description, number);
        io.sockets.in(roomId).emit('newDescription', description, number);
        question = number;
        const state = roomState[roomId];

        state.rolesToSockets[turn == 'blue' ? 'blueAgent' : 'redAgent'].emit('updateButtonsVisibility', GRID_SIZE, true);
    }

    function handleChooseTeam(role) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];

        if(state.rolesToPlayers[role] == null){
            if(playerSocket.id in state.playersToRoles && state.playersToRoles[playerSocket.id] != null){
                io.sockets.in(roomId).emit('changeTeam', state.playersToRoles[playerSocket.id], null);   
                state.rolesToPlayers[state.playersToRoles[playerSocket.id]] = null;  
            }
            state.rolesToPlayers[role] = playerSocket.id;
            state.rolesToSockets[role] = playerSocket;
            state.playersToRoles[playerSocket.id] = role;
            io.sockets.in(roomId).emit('changeTeam', role, playerSocket.id);
            if(Object.keys(state.playersToRoles).length == PLAYERS_NUMBER)
                io.sockets.in(roomId).emit('showStartBtn', true);    
        }
        else if(state.rolesToPlayers[role] == playerSocket.id){
            io.sockets.in(roomId).emit('changeTeam', state.playersToRoles[playerSocket.id], null);   
            state.rolesToPlayers[role] = null;
            state.playersToRoles[playerSocket.id] = null;
            io.sockets.in(roomId).emit('showStartBtn', false);
        }
    }

    function handleStartGame(){
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        const state = roomState[roomId];
        io.sockets.in(roomId).emit('initWords', state.words, GRID_SIZE);
        state.rolesToSockets['blueChef'].emit('initAgentsIdentities', state.agentsIdentities, GRID_SIZE);
        state.rolesToSockets['redChef'].emit('initAgentsIdentities', state.agentsIdentities, GRID_SIZE);
        state.rolesToSockets['blueChef'].emit('updateDescriptionsVisibility', true);
        io.sockets.in(roomId).emit('startGame');
        turn = 'blue';
    }

    function handleGuess(position) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }       
        const state = roomState[roomId];
        console.log(position);

        if(state.agentsIdentities[position[0]][position[1]] == 1){
            if(turn != 'blue'){
                QuestionToZero();
            }
        } else if(state.agentsIdentities[position[0]][position[1]] == 2){
            if(turn != 'red'){
                QuestionToZero();
            }
        } else if(state.agentsIdentities[position[0]][position[1]] == 3){
            finishGame(turn == 'blue' ? 'red' : 'blue');
        } else if(state.agentsIdentities[position[0]][position[1]] == 0){
            QuestionToZero();
        }
        question--;
        if(question == 0){
            QuestionToZero();
        }
        
        io.sockets.in(roomId).emit('newGuess', position, state.agentsIdentities, turn);
    }

    function QuestionToZero(){
        question = 0;
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }       
        const state = roomState[roomId];
        if(question == 0){
            turn = turn == 'blue' ? 'red' : 'blue';
            state.rolesToSockets['blueAgent'].emit('updateButtonsVisibility', GRID_SIZE, false);
            state.rolesToSockets['redAgent'].emit('updateButtonsVisibility', GRID_SIZE, false);
            state.rolesToSockets['blueChef'].emit('updateDescriptionsVisibility', turn == 'blue' ? true : false);
            state.rolesToSockets['redChef'].emit('updateDescriptionsVisibility', turn == 'red' ? true : false);
            state.rolesToSockets['blueAgent'].emit('updateDescriptionsVisibility', false);
            state.rolesToSockets['redAgent'].emit('updateDescriptionsVisibility', false);
        }
    }

    function handlePass() {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log("PASS");
    }

    function finishGame(winner){
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
console.log( 'server listens' );
