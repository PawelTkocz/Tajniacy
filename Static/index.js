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
socket.on('chooseTeams', handleChooseTeams);
socket.on('changeTeam', handleChangeTeam);
socket.on('showStartBtn', handleShowStartBtn);
socket.on('initWords', handleInitWords);
socket.on('initAgentsIdentities', handleInitAgentsIdentities);
socket.on('updateDescriptionsVisibility', updateDescriptionsVisibility);
socket.on('updateButtonsVisibility', updateButtonsVisibility);
socket.on('newGuess', handleNewGuess);

const waitForGameScreen = document.getElementById('waitForGame');
const chooseTeamsScreen = document.getElementById('chooseTeams');
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
const blueAgentBtn = document.getElementById('blueAgentBtn');
const blueChefBtn = document.getElementById('blueChefBtn');
const redAgentBtn = document.getElementById('redAgentBtn');
const redChefBtn = document.getElementById('redChefBtn');
const blueAgentName = document.getElementById('blueAgentName');
const redAgentName = document.getElementById('redAgentName');
const blueChefName = document.getElementById('blueChefName');
const redChefName = document.getElementById('redChefName');
const startGameBtn = document.getElementById('StartGameBtn');

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

function clickAgent(row, column) {
  socket.emit('guessAgent', [row, column]);
}

function chooseTeam(role) {
  socket.emit('chooseTeam', role);
}

function startGame() {
  socket.emit('startGame');
}

let gameActive = true;

function handleWaitForGame() {
  initialScreen.style.display = "none";
  waitForGameScreen.style.display = "block";
  chooseTeamsScreen.style.display = "none";
  gameScreen.style.display = "none";
}

function handleStartGame() {
  initialScreen.style.display = "none";
  waitForGameScreen.style.display = "none";
  chooseTeamsScreen.style.display = "none";
  gameScreen.style.display = "block";
}

function handleChooseTeams() {
  initialScreen.style.display = "none";
  waitForGameScreen.style.display = "none";
  chooseTeamsScreen.style.display = "block";
  gameScreen.style.display = "none";
}

function handleShowStartBtn(flag) {
  if (flag)
    startGameBtn.style.display = "block";
  else
    startGameBtn.style.display = "none";
}

function handleChangeTeam(role, player) {
  const roles = ['blueAgent', 'blueChef', 'redAgent', 'redChef'];
  const rolesButtons = [blueAgentBtn, blueChefBtn, redAgentBtn, redChefBtn];
  const rolesNames = [blueAgentName, blueChefName, redAgentName, redChefName];
  let i = roles.indexOf(role);

  if (player == null) {
    rolesNames[i].innerHTML = "_";
    rolesButtons[i].classList.add('unchecked');
    rolesButtons[i].classList.remove('checked');
  }
  else {
    rolesNames[i].innerHTML = player;
    rolesButtons[i].classList.add('checked');
    rolesButtons[i].classList.remove('unchecked');
  }
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  console.log(gameState);
}

function handleGameOver(winner) {
  if (!gameActive) {
    return;
  }
  gameActive = false;
  alert('Game Over. Winner: ' + winner);
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleWaitingPlayers(number) {
  waitingPlayers.innerText = number + "/" + "4";
}

function sendDescription(description, number) {
  var description = document.getElementById('descriptionIn');
  var number = document.getElementById('amountIn');
  socket.emit('giveDescription', description.value, number.value);
}

function handleUnknownGameCode() {
  reset();
  alert('Podano niepoprawny kod pokoju')
}

function handleTooManyPlayers() {
  reset();
  alert('W pokoju znajduje sie maksymalna liczba graczy');
}

function handleNewDescription(description, number) {
  var descriptionOutput = document.getElementById('descriptionOut');
  var amountOutput = document.getElementById('amountOut');
  descriptionOutput.value = description;
  amountOutput.value = number;
}

function clearDescription() {
  var descriptionIn = document.getElementById('descriptionIn');
  var amountIn = document.getElementById('amountIn');
  var descriptionOut = document.getElementById('descriptionOut');
  var amountOut = document.getElementById('amountOut');
  descriptionIn.value = '';
  amountIn.value = '';
  descriptionOut.value = '';
  amountOut.value = '';
}

function handleInitWords(words, gridSize) {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let elem = document.getElementById(i.toString() + j.toString());
      elem.innerHTML = words[i][j];
    }
  }
}

function handleInitAgentsIdentities(identities, gridSize) {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let elem = document.getElementById(i.toString() + j.toString());
      if (identities[i][j] == 1)
        elem.classList.add('unrevealedBlue');
      else if (identities[i][j] == 2)
        elem.classList.add('unrevealedRed');
      else if (identities[i][j] == 3)
        elem.classList.add('unrevealedBlack');
    }
  }
}

function handleNewGuess(position, identities, turn) {
  let elem = document.getElementById(position[0].toString() + position[1].toString());
  if (identities[position[0]][position[1]] == 1) {
    elem.classList.remove('unrevealedBlue');
    elem.classList.add('revealedBlue');
  }
  else if (identities[position[0]][position[1]] == 0) {
    elem.classList.add('revealedNeutral');
  }
  else if (identities[position[0]][position[1]] == 2) {
    elem.classList.remove('unrevealedRed');
    elem.classList.add('revealedRed');
  }
  else if (identities[position[0]][position[1]] == 3) {
    elem.classList.remove('unrevealedBlack');
    // elem.classList.add('revealedBlack');
  }
}


function updateDescriptionsVisibility(bool) {
  clearDescription();
  const descriptionsDivIn = document.getElementById('descriptionInput');
  const descriptionsDivOut = document.getElementById('descriptionOutput');
  descriptionsDivIn.style.display = bool ? 'block' : 'none';
  descriptionsDivOut.style.display = bool ? 'none' : 'block';
}

function updateButtonsVisibility(gridSize, bool) {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let elem = document.getElementById(i.toString() + j.toString());
      elem.disabled = !bool;
    }
  }
}

function reset() {
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
  chooseTeamsScreen.style.display = "none";
  waitForGameScreen.style.display = "none";
}
