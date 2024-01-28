var http = require('http');
var socket = require('socket.io');
var express = require('express');

var app = express();

app.set('view engine', 'ejs');
app.set('views', '../Client');

app.use( express.static( "../Static" ) );

var server = http.createServer(app);
var io = socket(server);

app.get('/', function(req, res) {var cookieValue;
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
    res.render('index', {wordRows : generatedWords, revealedIdentities: revealedIdentities, agentsIdentities: agentsIdentities});
});

const { initGame, gameLoop } = require('./game');
const { PLAYERS_NUMBER } = require('./constants');
const { makeRoomId } = require('./utils');

const roomState = {};
const playersCurrentRoom = {};

io.on('connection', function(playerSocket) {
    playerSocket.on('newGame', handleNewGame);
    playerSocket.on('joinGame', handleJoinGame);
    playerSocket.on('giveDescription', handleDescription);
    playerSocket.on('guessAgent', handleGuess);
    playerSocket.on('pass', handlePass);

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
        playerSocket.number = roomPlayersNumber+1;

        if(roomPlayersNumber == PLAYERS_NUMBER-1){
            io.sockets.in(roomId).emit('startGame');
            play(roomId);
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
        playerSocket.number = 1;
    }

    function handleDescription(description) {
        const roomId = playersCurrentRoom[playerSocket.id];
        if (!roomId) {
            return;
        }
        console.log(description);
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


function play(roomId) {
    
    const winner = gameLoop(roomState[roomId]);

    if (!winner) {
        emitGameState(roomId, roomState[roomId]);
    } else {
        emitGameOver(roomId, winner);
        roomState[roomId] = null;
    }
}


function emitGameState(room, gameState) {
    // Send this event to everyone in the room.
    io.sockets.in(room).emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
    io.sockets.in(room).emit('gameOver', JSON.stringify(winner));
}

server.listen(3000);
console.log( 'server listens' );
