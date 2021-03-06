//@ts-check

class Message {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

const url = window.location.hostname;
const result = url.replace(/(^\w+:|^)\/\//, "");
const socket = new WebSocket("wss://" + result);
const gameinfoele = document.getElementById("gameinfo");
const extrainfo = document.getElementById("extrainfo");
const gameinfoplayerele = document.getElementById("gameinfoplayer");

let playerNumber = -1;
let currDice = 0;
let currPawn;
let gameState = 0;
let currentPlayer = 0;
let gameStateChanged = false;

let playerColors = [
  { color: "#949BA6", name: "GRAY" },
  { color: "#2A5CBF", name: "BLUE" },
  { color: "#011126", name: "DARKBLUE" },
  { color: "#45648C", name: "GRAYBLUE" },
];

const pawnStartPositions = [
  [
    { x: 1, y: 10 },
    { x: 1, y: 11 },
    { x: 2, y: 10 },
    { x: 2, y: 11 },
  ],
  [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
  ],
  [
    { x: 10, y: 1 },
    { x: 10, y: 2 },
    { x: 11, y: 1 },
    { x: 11, y: 2 },
  ],
  [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 11, y: 10 },
    { x: 11, y: 11 },
  ],
];

let destNumbers = [40, 10, 20, 30];

let pawns = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];
function throwdice() {
  if (gameState == 2 && currentPlayer == playerNumber) {
    socket.send("2-");
  }
}

function initConnection(data) {
  playerNumber = parseInt(data);
  keepAlive();
  let name = playerColors[playerNumber - 1].name;
  const playerinfo2element = document.getElementById("playerinfo2");
  const playercolorelement = document.getElementById("playercolor");
  playercolorelement.style.color = playerColors[playerNumber - 1].color;
  playercolorelement.style.fontWeight = "bold";
  playerinfo2element.innerHTML = "You're ";
  playercolorelement.innerHTML = name;
}

function updateGameStatus(data) {
  gameinfoplayerele.style.visibility = "hidden";
  gameinfoplayerele.innerHTML = "";
  gameStateChanged = true;
  if (data.startsWith("0")) {
    gameinfoele.innerHTML =
      data.split("=")[1] + " Player(s) waiting for game to start...";
  }
  if (data == "1") {
    gameState = 1;
    console.log("Game is starting... Initializing pawns");
    gameinfoele.innerHTML = "Game is starting...";
    initpawns();
  }
  if (data.startsWith("2")) {
    gameState = 2;
    currentPlayer = parseInt(data.split("=")[1]);
    gameinfoplayerele.style.visibility = "visible";
    gameinfoplayerele.innerHTML = playerColors[currentPlayer - 1].name;
    gameinfoplayerele.style.color = playerColors[currentPlayer - 1].color;
    gameinfoele.innerHTML = " is currently throwing";
  }

  if (data.startsWith("3")) {
    gameState = 3;
    currentPlayer = parseInt(data.split("=")[1]);
    gameinfoplayerele.style.visibility = "visible";
    gameinfoplayerele.innerHTML = playerColors[currentPlayer - 1].name;
    gameinfoplayerele.style.color = playerColors[currentPlayer - 1].color;
    gameinfoele.innerHTML = " is currently moving";

    if (currentPlayer == playerNumber) {
      console.log("checking if move available");
      //CHECK IF A MOVE IS AVAILABLE
      let moveAvail = false;
      for (var i = 0; i < 4; i++) {
        let testPawn = document.getElementById(
          "pawn-" + playerNumber + "-" + (i + 1)
        );
        let currentPlace = parseInt(testPawn.getAttribute("boardPlace"));
        let newPlace = currentPlace + currDice;

        //FOR IF TO MOVE TO DEST SQUARE
        if (
          newPlace > destNumbers[playerNumber - 1] &&
          newPlace <= destNumbers[playerNumber - 1] + 7 &&
          currentPlace <= destNumbers[playerNumber - 1] &&
          currentPlace <= 40
        ) {
          newPlace = newPlace - destNumbers[playerNumber - 1];
          if (newPlace > 4) {
            if (newPlace == 5) newPlace = 3;
            else if (newPlace == 6) newPlace = 2;
            else if (newPlace == 7) newPlace = 1;
          }
          newPlace += 40 + (playerNumber - 1) * 4;
        }
        if (currentPlace + currDice > 40) {
        }
        if (
          currentPlace != 0 &&
          //  (parseInt(testPawn.getAttribute("boardPlace")) + currDice <= destNumbers[playerNumber - 1] + 4)) &&
          newPlace <= 40 + (playerNumber - 1) * 4 + 4 &&
          !pawns[playerNumber - 1].includes(newPlace)
        ) {
          moveAvail = true;
        } else if (
          currDice == 6 &&
          currentPlace == 0 &&
          !pawns[playerNumber - 1].includes((playerNumber - 1) * 10 + 1)
        ) {
          moveAvail = true;
        }
      }

      if (!moveAvail) {
        console.log("SAD");
        socket.send("3-0");
      }
    }
  }

  if (data.startsWith("4")) {
    gameState = 4;
    let finishreason = data.split("=")[1];
    if (finishreason == "0") {
      gameinfoele.innerHTML = "Player left! Aborting game...";
      /* TODO MAKE PAGE GO BACK TO SPLASH SCREEN */
      setTimeout(() => {
        window.location.replace("/");
      }, 2000);
    } else {
      gameinfoele.innerHTML = " player has won!";
      gameinfoplayerele.style.visibility = "visible";
      gameinfoplayerele.innerHTML = playerColors[finishreason - 1].name;
      gameinfoplayerele.style.color = playerColors[finishreason - 1].color;
      setTimeout(() => {
        window.location.replace("/");
      }, 5000);
    }
  }
}

function keepAlive() {
  setTimeout(() => {
    socket.send("UPDATE");
    keepAlive();
  }, 20000);
}

function updateDiceThrow(data) {
  currDice = parseInt(data);
  const newdice = "images/" + parseInt(data) + "dice.svg";

  let diceele = document.getElementById("altdice");
  diceele.setAttribute(
    "style",
    "animation: diceanim 1.0s infinite; animation-timing-function: steps(1, end);"
  );
  setTimeout(() => {
    let styleele = "background-image: url('../" + newdice + "');";
    diceele.setAttribute("style", styleele);
    // document.getElementById("altdice").setAttribute("src", newdice);
    // document.getElementById("altdice").setAttribute("value", newdice);
  }, 2000);

  // document.getElementById("diceimage").setAttribute("src", newdice);
  // document.getElementById("diceimage").setAttribute("value", newdice);
}

function updatePawn(data) {
  console.log("command of type 3 received: " + data);
  let pawnPlayer = data.split("=")[0];
  let pawnNumber = data.split("=")[1];
  let newBoardPlace = data.split("=")[2];
  pawns[pawnPlayer - 1][pawnNumber - 1] = parseInt(newBoardPlace);
  let movedPawn = document.getElementById(
    "pawn-" + pawnPlayer + "-" + pawnNumber
  );
  movedPawn.setAttribute("boardPlace", newBoardPlace);
  if (newBoardPlace == 0) {
    movedPawn.style.gridColumn =
      pawnStartPositions[pawnPlayer - 1][pawnNumber - 1].x.toString();
    movedPawn.style.gridRow =
      pawnStartPositions[pawnPlayer - 1][pawnNumber - 1].y.toString();
  } else {
    let correctBox = document.getElementById("box-" + newBoardPlace);
    movedPawn.style.gridRow = correctBox.style.gridRow;
    movedPawn.style.gridColumn = correctBox.style.gridColumn;
  }
}

socket.onmessage = function (event) {
  console.log(event.data);
  let type = event.data.split("-")[0];
  let data = event.data.split("-")[1];

  //INITIAL CONNECTION (RECEIVE PLAYER NUMBER/COLOR)
  if (type == "0") {
    initConnection(data);
  }

  //RECEIVE NEW GAME STATUS
  if (type == "1") {
    updateGameStatus(data);
  }

  //RECEIVE A DICE THROW
  if (type == "2") {
    updateDiceThrow(data);
  }

  //RECEIVE A MOVE
  if (type == "3") {
    updatePawn(data);
  }
  //target.innerHTML = event.data;
};

socket.onopen = function () {
  socket.send("0-null");
  gameinfoele.innerHTML = "Requesting to connect to server...";
};

function initpawns() {
  for (var j = 1; j < 5; j++) {
    for (var i = 1; i < 5; ++i) {
      let id = "pawn-" + j + "-" + i;
      let currpawn = document.getElementById(id);
      currpawn.style.gridRow = pawnStartPositions[j - 1][i - 1].y.toString();
      currpawn.style.gridColumn = pawnStartPositions[j - 1][i - 1].x.toString();
      currpawn.style.visibility = "visible";
      currpawn.setAttribute("boardPlace", "0");
    }
  }
}

function movepawn(pawn) {
  if (gameState == 3 && currentPlayer == playerNumber) {
    let newPawn = document.getElementById("pawn-" + pawn);
    if (typeof currPawn !== "undefined") {
      if (currPawn != newPawn) {
        if (currPawn.classList.contains("gray")) {
          currPawn.style.backgroundColor = playerColors[0].color;
        } else if (currPawn.classList.contains("blue")) {
          currPawn.style.backgroundColor = playerColors[1].color;
        } else if (currPawn.classList.contains("darkblue")) {
          currPawn.style.backgroundColor = playerColors[2].color;
        } else if (currPawn.classList.contains("grayblue")) {
          currPawn.style.backgroundColor = playerColors[3].color;
        }
      }
    }
    let oldPawn = currPawn;
    currPawn = newPawn;
    let pawnPlayer = pawn.split("-")[0];
    let pawnNumber = pawn.split("-")[1];
    let currPlace = parseInt(currPawn.getAttribute("boardPlace"));
    let newBoardPlace = currPlace + currDice;
    if (pawnPlayer == playerNumber) {
      //CHECK IF CURRENT PAWN IS AT HOME
      if (
        currPlace == 0 &&
        currDice == 6 &&
        !pawns[playerNumber - 1].includes((playerNumber - 1) * 10 + 1)
      ) {
        currPawn.style.backgroundColor = "red";
        let homeSquare = document.getElementById(
          "box-" + ((playerNumber - 1) * 10 + 1)
        );
        let highlightedSquare = document.getElementById("highlighted-1");
        highlightedSquare.style.gridRow = homeSquare.style.gridRow;
        highlightedSquare.style.gridColumn = homeSquare.style.gridColumn;
        highlightedSquare.style.visibility = "visible";

        //IF A PAWN IS NOT AT HOME, TREAT NORMALLY
      } else if (currPlace != 0) {
        let isDestSquare = false;

        //IF THE PAWN IS TO MOVE TO DESTINATION SQUARE
        if (
          newBoardPlace > destNumbers[playerNumber - 1] &&
          newBoardPlace <= destNumbers[playerNumber - 1] + 7 &&
          currPlace <= destNumbers[playerNumber - 1] &&
          currPlace <= 40
        ) {
          console.log("Pawn is going to destination square");
          isDestSquare = true;
          newBoardPlace = newBoardPlace - destNumbers[playerNumber - 1];
          if (newBoardPlace > 4) {
            newBoardPlace = 8 % newBoardPlace;
          }
          newBoardPlace += 40 + (playerNumber - 1) * 4;
        }

        //CHECK IF PAWN IS NOT OBSTRUCTED BY OTHER FRIENDLY PAWN
        if (!pawns[playerNumber - 1].includes(newBoardPlace)) {
          //CHECK IF MOVE DOESN'T MOVE PAWN TOO FAR (ONLY WHEN ALREADY IN DEST SUARES)
          if (newBoardPlace <= 40 + (playerNumber - 1) * 4 + 4) {
            console.log("normal pawn routine");
            if (currPlace > 40) {
              // if (newBoardPlace <= destNumbers[playerNumber - 1] + 4) {
              isDestSquare = true;
              // }
            }
            if (newBoardPlace > 40 && !isDestSquare) newBoardPlace -= 40;
            console.log(newBoardPlace);
            let newSquare = document.getElementById("box-" + newBoardPlace);
            currPawn.style.backgroundColor = "red";
            let highlightedSquare = document.getElementById("highlighted-1");
            highlightedSquare.style.gridRow = newSquare.style.gridRow;
            highlightedSquare.style.gridColumn = newSquare.style.gridColumn;
            highlightedSquare.style.visibility = "visible";
          } else {
            console.log("Can't move pawn up even further!");
            currPawn = oldPawn;
            currPawn.style.backgroundColor = "red";
            changeExtraInfo("Can't move pawn up even further!");
          }
        } else {
          console.log("Another friendly pawn already at destination!");
          currPawn = oldPawn;
          currPawn.style.backgroundColor = "red";
          changeExtraInfo("Another friendly pawn already at destination!");
        }
      } else {
        console.log("You haven't thrown 6 so you can't move pawn from home!");
        currPawn = oldPawn;
        currPawn.style.backgroundColor = "red";
        changeExtraInfo(
          "You haven't thrown 6 so you can't move pawn from home!"
        );
      }
    } else {
      console.log("That is not your pawn!");
      currPawn = oldPawn;
      currPawn.style.backgroundColor = "red";
      changeExtraInfo("That is not your pawn!");
    }
  }
}

function confirmmove() {
  let infoarray = currPawn.getAttribute("id").split("-");
  //currPawn.style.backgroundColor = "default";
  if (currPawn.classList.contains("gray")) {
    currPawn.style.backgroundColor = playerColors[0].color;
  } else if (currPawn.classList.contains("blue")) {
    currPawn.style.backgroundColor = playerColors[1].color;
  } else if (currPawn.classList.contains("darkblue")) {
    currPawn.style.backgroundColor = playerColors[2].color;
  } else if (currPawn.classList.contains("grayblue")) {
    currPawn.style.backgroundColor = playerColors[3].color;
  }

  let pawnNumber = infoarray[2];
  let message = "3-" + pawnNumber;
  socket.send(message);
  console.log("Server command sent: " + message);
  let highlightedSquare = document.getElementById("highlighted-1");
  highlightedSquare.style.visibility = "hidden";
}

function changeExtraInfo(message) {
  extrainfo.innerHTML = message;
  setTimeout(() => {
    extrainfo.innerHTML = "";
  }, 5000);
}

function sendcommand(message) {
  socket.send(message);
}

function startAI() {
  if (currentPlayer === playerNumber && gameStateChanged) {
    switch (gameState) {
      case 0:
        console.log("AI waiting for game to start");
        break;
      case 1:
        console.log("AI waiting on end of init");
        break;
      case 2:
        socket.send("2-");
        gameStateChanged = false;
        break;
      case 3:
        let randpawns = [Math.floor(Math.random() * 4) + 1];
        for (let i = 1; i < 5; i++)
          if (!randpawns.includes(i)) randpawns.push(i);
        for (let i = 0; i < 4; i++) {
          if (moveAI(randpawns[i])) {
            socket.send("3-" + randpawns[i]);
            gameStateChanged = false;
            break;
          }
        }
        gameStateChanged = false;
        break;
      case 4:
        console.log("Game ended, so AI ended");
        return;
    }
  }
  setTimeout(() => {
    startAI();
  }, 50);
}

function moveAI(pawnNumber) {
  let currPlace = pawns[playerNumber - 1][pawnNumber - 1];
  let newBoardPlace = currPlace + currDice;
  if (
    currPlace === 0 &&
    currDice === 6 &&
    !pawns[playerNumber - 1].includes((playerNumber - 1) * 10 + 1)
  )
    return true;
  else if (currPlace !== 0) {
    let isDestSquare = false;
    if (
      newBoardPlace > destNumbers[playerNumber - 1] &&
      newBoardPlace <= destNumbers[playerNumber - 1] + 7 &&
      currPlace <= destNumbers[playerNumber - 1] &&
      currPlace <= 40
    ) {
      isDestSquare = true;
      newBoardPlace = newBoardPlace - destNumbers[playerNumber - 1];
      if (newBoardPlace > 4) {
        newBoardPlace = 8 % newBoardPlace;
      }
      newBoardPlace += 40 + (playerNumber - 1) * 4;
    }
    if (!pawns[playerNumber - 1].includes(newBoardPlace)) {
      if (newBoardPlace <= 40 + (playerNumber - 1) * 4 + 4) {
        console.log("normal pawn routine");
        if (currPlace > 40) {
          isDestSquare = true;
        }
        if (newBoardPlace > 40 && !isDestSquare) newBoardPlace -= 40;
        return true;
      } else {
        console.log("Can't move pawn up even further!");
        return false;
      }
    } else {
      console.log("Another friendly pawn already at destination!");
      return false;
    }
  } else {
    console.log("You haven't thrown 6 so you can't move pawn from home!");
    return false;
  }
}
