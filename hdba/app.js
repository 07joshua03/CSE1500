/*
Game states:
0: Game not started yet
1: Game is starting
2:  Player is throwing dice
  - Player Number
3: Player is making move
  - Player number
4: Game is finished
  - 0 if game aborted or player number if player won
*/
class GameInstance {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.gameState = 0;
    this.pawns = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    this.currentDice = 0;
    this.currentPlayer = 0;
  }
}

class Player {
  constructor(playerID, gameInstance, ws, playern) {
    this.playerID = playerID; /* player ID */
    this.gameInstance = gameInstance; /* gameInstance*/
    this.ws = ws; /* current websocket */
    this.playern = playern; /* Player number ingame: between 1 and 4 */
  }
}

//@ts-check
const express = require("express");
const http = require("http");
const websocket = require("ws");
const favicon = require("serve-favicon");

const indexRouter = require("./routes/index");

// @ts-ignore
const port = process.argv[2];
const app = express();

app.set("view engine", "ejs"); /*CHECK*/
// @ts-ignore
app.use(express.static(__dirname + "/public"));
// @ts-ignore
app.use(favicon(__dirname + "/public/images/favicon.ico"));
const server = http.createServer(app);

app.get("/", indexRouter);
app.get("/game", indexRouter);

console.log("Starting web-server!")

const wss = new websocket.Server({ server });

let gameInstances = [new GameInstance(1)];
let players = [];



function newPlayer(ws) {
  console.log("A new player has tried connecting to server!");
  if (gameInstances.length == 0 || gameInstances[gameInstances.length - 1].players.length >= 4 || gameInstances[gameInstances.length - 1].gameState != 0) {
    gameInstances.push(new GameInstance(gameInstances.length));
    console.log("Created new game instance with id: " + gameInstances[gameInstances.length - 1].id);
  }
  let playerID = players.length;
  let gameInstance = gameInstances[gameInstances.length - 1];
  let playerNumber = gameInstance.players.length + 1;
  let player = new Player(playerID, gameInstance, ws, playerNumber);
  gameInstances[gameInstances.length - 1].players.push(player);
  console.log("Player with ID: " + playerID + " joined gameInstance ID: " + gameInstance.id);

  ws.send("0-" + playerNumber);
  players.push(player);
  if (gameInstance.players.length == 4) {
    gameInstance.currentPlayer = 1;
    gameInstance.players.forEach(element => {
      gameInstance.gameState = 1;
      element.ws.send("1-1");
      gameInstance.gameState = 2;
      gameInstance.currentPlayer = 1;
      element.ws.send("1-2=1");
    });
  } else {
    gameInstance.players.forEach(element => {
      element.ws.send("1-0=" + gameInstance.players.length);
    });
  }
}

function throwDice(ws) {
  let player = getPlayer(ws);
  let gameInstance = player.gameInstance;

  if (gameInstance.currentPlayer == player.playern) {
    const diceThrow = Math.floor(Math.random() * 6) + 1;
    gameInstance.currDice = diceThrow;
    gameInstance.players.forEach(element => {
      element.ws.send("2-" + diceThrow);
    });
    gameInstance.gameState = 3;
    gameInstance.players.forEach(element => {
      element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
    });
  } else {
    console.log("possible cheater ID: " + player.playerID);
  }
}

function movePawn(ws, data) {
  let currPlayer = getPlayer(ws);
  if (data == "0") {
    console.log("No move available!");
  } else {
    if (currPlayer.gameInstance.currentPlayer == currPlayer.playern) {
      console.log("Pawn N: " + data + " moved by player ID: " + currPlayer.playerID);
      let currPlace = currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1];
      if (currPlace == 0) {
        currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1] = (currPlayer.playern - 1) * 10 + 1;
      } else {
        let newBoardPlace = currPlace + currPlayer.gameInstance.currDice;
        let destNumbers = [40, 10, 20, 30];
        let isDestSquare = false;
        let playerNumber = currPlayer.playern;
        if (newBoardPlace >= destNumbers[playerNumber - 1] && newBoardPlace <= destNumbers[playerNumber - 1] + 7) {
          isDestSquare = true;
          newBoardPlace = newBoardPlace - destNumbers[playerNumber - 1];
          console.log(newBoardPlace);
          if (newBoardPlace > 4) {
            if (newBoardPlace == 5) newBoardPlace = 3;
            else if (newBoardPlace == 6) newBoardPlace = 2;
            else if (newBoardPlace == 7) newBoardPlace = 1;
          }
          newBoardPlace += 40 + (playerNumber - 1) * 4;
        } else {
          isDestSquare = false;
        }

        if (newBoardPlace > 40 && !isDestSquare) newBoardPlace -= 40;
        currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1] = newBoardPlace;
      }
      //CHECK IF THERE IS OPPONENT PAWN AT NEW BOARDPLACE
      for (let i = 0; i < 4; ++i) {
        if (i != currPlayer.playern - 1) {
          for (let j = 0; j < currPlayer.gameInstance.pawns[i].length; ++j) {
            if (currPlayer.gameInstance.pawns[i][j] == currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1]) {
              currPlayer.gameInstance.pawns[i][j] = 0;
              currPlayer.gameInstance.players.forEach(element => {
                element.ws.send("3-" + (i + 1) + "=" + (j + 1) + "=0");
              });
            }
          }
        }
      }
      /*command: type: 2, pawnPlayer: 1-4, pawnNumber: 1-4, boardPlace: 1-40 */
      let message = "3-" + currPlayer.playern + "=" + data + "=" + currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1];
      currPlayer.gameInstance.players.forEach(element => {
        element.ws.send(message);
      });
    }
  }
  let gameInstance = currPlayer.gameInstance;

  let hasWon = true;
  for (var i = 0; i < 4; ++i) {
    if (gameInstance.pawns[gameInstance.currentPlayer - 1][i] <= (40 + (gameInstance.currentPlayer - 1) * 4) || gameInstance.pawns[gameInstance.currentPlayer - 1][i] > 44 + (gameInstance.currentPlayer - 1) * 4) hasWon = false;
  }
  if (hasWon) {
    gameInstance.players.forEach(element =>{
      element.ws.send("1-4=" + gameInstance.currentPlayer);
    });
    console.log("PLAYER HAS WON");
  } else {
    gameInstance.currentPlayer += 1;
    if (gameInstance.currentPlayer > 4) gameInstance.currentPlayer = 1;
    gameInstance.gameState = 2;
    gameInstance.players.forEach(element => {
      element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
    });
  }


}

function playerLeft(ws) {
  let player = getPlayer(ws);
  console.log("Player ID: " + player.playerID + " left!");
  player.gameInstance.gameState = "4-0";
  player.gameInstance.players.forEach(element => {
    element.ws.send("1-4=0");
  });
}

function getPlayer(ws) {
  let player = null;
  for (var i = 0; i < players.length; ++i) {
    if (ws == players[i].ws) player = players[i];
  }
  return player;
}

function debug(ws, data) {
  let sentPlayer = getPlayer(ws);
  let gameInstance = sentPlayer.gameInstance;
  let dataarray = data.split("=");
  let password = dataarray[0];


  if (password == "MOVE") {
    let pawnPlayer = parseInt(dataarray[1]);
    let pawnNumber = parseInt(dataarray[2]);
    let boardPlace = parseInt(dataarray[3]);
    console.log("DEBUG COMMAND RECEIVED: " + data);
    gameInstance.pawns[pawnPlayer - 1][pawnNumber - 1] = boardPlace;
    //CHECK IF ANOTHER OPPONENT IS ALREADY THERE
    for (let i = 0; i < 4; ++i) {
      if (i != pawnPlayer - 1) {
        for (let j = 0; j < gameInstance.pawns[i].length; ++j) {
          if (gameInstance.pawns[i][j] == gameInstance.pawns[pawnPlayer - 1][pawnNumber - 1]) {
            gameInstance.pawns[i][j] = 0;
            gameInstance.players.forEach(element => {
              element.ws.send("3-" + (i + 1) + "=" + (j + 1) + "=0");
            });
          }
        }
      }
    }
    gameInstance.players.forEach(player => {
      /*command: type: 2, pawnPlayer: 1-4, pawnNumber: 1-4, boardPlace: 1-40 */
      player.ws.send("3-" + pawnPlayer + "=" + pawnNumber + "=" + boardPlace);
    });
    gameInstance.currentPlayer += 1;
    if (gameInstance.currentPlayer > 4) gameInstance.currentPlayer = 1;
    gameInstance.gameState = 2;
    gameInstance.players.forEach(element => {
      element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
    });
  }

  if (password == "THROW") {
    let dicePlayer = dataarray[1];
    let diceAmount = dataarray[2];
    gameInstance.currDice = parseInt(diceAmount);
    gameInstance.currentPlayer = parseInt(dicePlayer);
    gameInstance.players.forEach(element => {
      element.ws.send("2-" + diceAmount);
    });
    gameInstance.gameState = 3;

    gameInstance.players.forEach(element => {
      element.ws.send("1-" + gameInstance.gameState + "=" + dicePlayer);
    });
  }
}

wss.on("connection", function (ws) {

  // setTimeout(function () {
  //   console.log("Connection state: " + ws.readyState);
  //   ws.send("Thanks for the message. --Server");
  //   ws.close();
  //   console.log("Connection status: " + ws.readyState);
  // }, 2000);

  ws.on("message", function incoming(message) {
    let stringmessage = "" + message;
    let type = stringmessage.split("-")[0];
    let data = stringmessage.split("-")[1];
    // console.log(stringmessage);

    //PLAYER TRIES TO CONNECT
    if (type == "0") {
      newPlayer(ws);
    }

    if (type == "1") {
      debug(ws, data);
    }

    //PLAYER TRIES TO THROW DICE
    if (type == "2") {
      throwDice(ws);
    }

    //PLAYER TRIES TO MOVE
    if (type == "3") {
      movePawn(ws, data);
    }

  });

  ws.on("close", function (code) {
    playerLeft(ws);
  });

});

server.listen(port);
