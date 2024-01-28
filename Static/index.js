const socket = io();

socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('waitingPlayers', handleWaitingPlayers);
socket.on('waitForGame', handleWaitForGame);
socket.on('unknownGameCode', handleUnknownGameCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('newDescription', handleNewDescription);
socket.on('startGame', handleStartGame);

const waitForGameScreen = document.getElementById('waitForGame');
const GameScreen = document.getElementById('gameScreen');
const giveDescription = document.getElementById('giveDescription');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const waitingPlayers = document.getElementById('waitingPlayers');
const sendDescriptionBtn = document.getElementById('sendDescription');
const messagesList = document.getElementById('messages');


newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);
sendDescriptionBtn.addEventListener('click', sendDescription);


function newGame() {
  socket.emit('newGame');
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
}

function clickAgent(row, column){
  socket.emit('guessAgent', [row, column]);
}

let gameActive = false;

function handleWaitForGame() {
  initialScreen.style.display = "none";
  waitForGameScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function handleStartGame() {
  initialScreen.style.display = "none";
  waitForGameScreen.style.display = "none";
  gameScreen.style.display = "block";
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  console.log(gameState);
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You Win!');
  } else {
    alert('You Lose :(');
  }
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleWaitingPlayers(number) {
  waitingPlayers.innerText = number + "/" + "4";
}

function sendDescription(description) {
  var description = document.getElementById('description');
  socket.emit('giveDescription', description.value);
}

function handleUnknownGameCode() {
  reset();
  alert('Podano niepoprawny kod pokoju')
}

function handleTooManyPlayers() {
  reset();
  alert('W pokoju znajduje sie maksymalna liczba graczy');
}

function handleNewDescription(description) {
  var msg = document.getElementById('messages');
  msg.innerHTML += description + "<br/>";
}

function reset() {
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
