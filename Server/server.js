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

io.on('connection', function(playerSocket) {
    playerSocket.on('newGame', handleNewGame);
    playerSocket.on('joinGame', handleJoinGame);
    playerSocket.on('giveDescription', handleDescription);
    playerSocket.on('guessAgent', handleGuess);
    playerSocket.on('pass', handlePass);
    playerSocket.on('chooseTeam', handleChooseTeam);
    playerSocket.on('startGame', handleStartGame);

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
        // wyslij description do wszystkich ziutkow
        io.sockets.in(roomId).emit('newDescription', description, number);
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
        state.rolesToSockets['blueChef'].emit('updateDescriptionsVisibility');
        io.sockets.in(roomId).emit('startGame');
    }

    function handleGuess(position) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }        
        console.log(position);
    }

    function handlePass() {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log("PASS");
    }

});


function finishGame(roomId, winner){
    io.sockets.in(roomId).emit('gameOver', winner);
    roomState[roomId] = null;
}

server.listen(3000);
console.log( 'server listens' );
