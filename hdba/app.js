//@ts-check

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

// app.get("/", indexRouter);
app.get("/", function (req, res) {
  res.render("splash.ejs", { currentlyPlaying: getCurrentlyPlaying(), ongoingGames: getOngoingGames(), waiting: getWaiting() });
});
app.get("/game", indexRouter);

console.log("Starting web-server!")

const wss = new websocket.Server({ server });

let gameInstances = [new GameInstance(1)];
let players = [];



function newPlayer(ws) {
  if (gameInstances.length == 0 || gameInstances[gameInstances.length - 1].players.length >= 4 || gameInstances[gameInstances.length - 1].gameState != 0) {
    gameInstances.push(new GameInstance(gameInstances.length));
    console.log("GI " + gameInstances[gameInstances.length - 1].id + ": Created");
  }
  let playerID = players.length;
  let gameInstance = gameInstances[gameInstances.length - 1];
  let playerNumber = gameInstance.players.length + 1;
  let player = new Player(playerID, gameInstance, ws, playerNumber);
  gameInstances[gameInstances.length - 1].players.push(player);
  console.log("GI " + gameInstance.id + ": Player ID " + playerID + " joined");

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
    gameInstance.currentDice = diceThrow;
    console.log("GI " + gameInstance.id + ": Player " + player.playern + " dice: " + diceThrow);
    gameInstance.players.forEach(element => {
      element.ws.send("2-" + diceThrow);
    });
    gameInstance.gameState = 3;
    gameInstance.players.forEach(element => {
      element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
    });
  } else {
    console.log("GI " + gameInstance.id + ": possible cheater ID " + player.playerID + ": REASON INVALID DICE");
  }
}

function movePawn(ws, data) {
  let currPlayer = getPlayer(ws);
  let pawnNumber = parseInt(data);
  let gameInstance = currPlayer.gameInstance;

  let destNumbers = [40, 10, 20, 30];

  //INDICATES NO AVAIABLE MOVE FROM CLIENT-SIDE
  if (data == "0") {
    // console.log("GI " + currPlayer.gameInstance.id + ": No move avail for player ID: " + currPlayer.playerID + " N.: " + currPlayer.playern);
  } else {

    //CHECK IF CORRECT PLAYER TRIES TO MOVE
    if (gameInstance.currentPlayer == currPlayer.playern) {

      let currPlace = gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1];

      let newBoardPlace = currPlace + gameInstance.currentDice;

      //INCASE OF MOVING FROM HOME
      if(currPlace == 0){
        if(gameInstance.currentDice == 6){
          newBoardPlace = (currPlayer.playern - 1) * 10 + 1;
        }else{
          console.log(gameInstance.currentDice);
          console.log("GI " + gameInstance.id + ": Player " + currPlayer.playern + " move pawn from home without 6 CHEAT?");
        }
        //DEFAULT BEHAVIOR
      }else if (currPlace != 0){
        let isDestSquare = false;

        //INCASE OF MOVING TO DESTINATION SQUARE
        if(newBoardPlace > destNumbers[currPlayer.playern - 1] && newBoardPlace <= destNumbers[currPlayer.playern - 1] + 7 && currPlace <= destNumbers[currPlayer.playern - 1] && currPlace <= 40){
          isDestSquare = true;
          newBoardPlace = newBoardPlace - destNumbers[currPlayer.playern - 1];
          if (newBoardPlace > 4) {
              newBoardPlace = 8 % newBoardPlace;
          }
          newBoardPlace += 40 + (currPlayer.playern - 1) * 4;
        }

        //NORMAL CASE
        if(newBoardPlace <= 40 + (currPlayer.playern - 1) * 4 + 4){
          if(currPlace > 40){
            isDestSquare = true;
          }

          //INCASE PEOPLE TRY TO CHEAT FUCK EM
          if(newBoardPlace > 40 + (currPlayer.playern - 1) * 4 + 4) newBoardPlace = 40 + (currPlayer.playern - 1) * 4 + 4;
          if (newBoardPlace > 40 && !isDestSquare) newBoardPlace -= 40;

        }
        
      }
      currPlayer.gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1] = newBoardPlace;


      // if (currPlace == 0) {
      //   currPlayer.gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1] = (currPlayer.playern - 1) * 10 + 1;
      // } else {
      //   let newBoardPlace = currPlace + currPlayer.gameInstance.currentDice;
      //   let destNumbers = [40, 10, 20, 30];
      //   let isDestSquare = false;
      //   let playerNumber = currPlayer.playern;
      //   if (newBoardPlace > destNumbers[playerNumber - 1] && newBoardPlace <= destNumbers[playerNumber - 1] + 7 && currPlace <= destNumbers[playerNumber - 1] && currPlace <= 40) {
      //     isDestSquare = true;
      //     newBoardPlace = newBoardPlace - destNumbers[playerNumber - 1];
      //     if (newBoardPlace > 4) {
      //       if (newBoardPlace == 5) newBoardPlace = 3;
      //       else if (newBoardPlace == 6) newBoardPlace = 2;
      //       else if (newBoardPlace == 7) newBoardPlace = 1;
      //     }
      //     newBoardPlace += 40 + (playerNumber - 1) * 4;
      //   } else if (currPlace > 40) {
      //     if (newBoardPlace <= destNumbers[playerNumber - 1] + 4) {
      //       isDestSquare = true;
      //     }
      //   } else {
      //     isDestSquare = false;
      //   }

      //   if (newBoardPlace > 40 && !isDestSquare) newBoardPlace -= 40;
      //   currPlayer.gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1] = newBoardPlace;
      // }
      //CHECK IF THERE IS OPPONENT PAWN AT NEW BOARDPLACE
      for (let i = 0; i < 4; ++i) {
        if (i != currPlayer.playern - 1) {
          for (let j = 0; j < gameInstance.pawns[i].length; ++j) {
            if (gameInstance.pawns[i][j] == gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1]) {
              gameInstance.pawns[i][j] = 0;
              gameInstance.players.forEach(element => {
                element.ws.send("3-" + (i + 1) + "=" + (j + 1) + "=0");
              });
            }
          }
        }
      }
      /*command: type: 2, pawnPlayer: 1-4, pawnNumber: 1-4, boardPlace: 1-40 */
      let message = "3-" + currPlayer.playern + "=" + data + "=" + gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1];
      console.log("GI " + gameInstance.id + ": Player " + currPlayer.playern + " moved pawn " + pawnNumber + " from " + currPlace + " to " + gameInstance.pawns[currPlayer.playern - 1][pawnNumber - 1]);
      gameInstance.players.forEach(element => {
        element.ws.send(message);
      });
    }
  }

  let hasWon = true;
  for (var i = 0; i < 4; ++i) {
    if (gameInstance.pawns[gameInstance.currentPlayer - 1][i] <= (40 + (gameInstance.currentPlayer - 1) * 4) || gameInstance.pawns[gameInstance.currentPlayer - 1][i] > 44 + (gameInstance.currentPlayer - 1) * 4) hasWon = false;
  }
  if (hasWon) {
    gameInstance.players.forEach(element => {
      element.ws.send("1-4=" + gameInstance.currentPlayer);
    });
    gameInstance.gameState = 4;
    console.log("GI " + gameInstance.id + ": Player " + gameInstance.currentPlayer.playern + " has won");
  } else {
    if (gameInstance.currentDice == 6 || gameInstance.currentDice == 1) {
      gameInstance.gameState = 2;
      gameInstance.players.forEach(element => {
        element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
      });
    } else {

      gameInstance.currentPlayer += 1;
      if (gameInstance.currentPlayer > 4) gameInstance.currentPlayer = 1;
      gameInstance.gameState = 2;
      gameInstance.players.forEach(element => {
        element.ws.send("1-" + gameInstance.gameState + "=" + gameInstance.currentPlayer);
      });
    }
  }


}

function playerLeft(ws) {
  let player = getPlayer(ws);
  console.log("GI " + player.gameInstance.id +  ": Player " + player.playern + " ID: " + player.playerID + " left!");
  player.gameInstance.gameState = 4;
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

    console.log("GI " + sentPlayer.gameInstance.id + ": DEBUG Player " + pawnPlayer + " MOVE " + pawnNumber + " TO " + boardPlace);
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

    console.log("GI " + sentPlayer.gameInstance.id + ": DEBUG Player " + dicePlayer.playern + " DICE " + diceAmount);
    gameInstance.currentDice = parseInt(diceAmount); 
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

function getCurrentlyPlaying() {
  let currentlyPlaying = 0;
  for (var i = 0; i < gameInstances.length; i++) {
    if (gameInstances[i].gameState != 0 && gameInstances[i].gameState != 4) {
      currentlyPlaying += 4;
    }
  }
  return currentlyPlaying;
}

function getOngoingGames() {
  let ongoingGames = 0;
  for (var i = 0; i < gameInstances.length; i++) {
    if (gameInstances[i].gameState != 0 && gameInstances[i].gameState != 4) {
      ++ongoingGames;
    }
  }
  return ongoingGames;
}

function getWaiting() {
  let waiting = 0;
  if (gameInstances[gameInstances.length - 1].players.length != 4) waiting = gameInstances[gameInstances.length - 1].players.length;
  return waiting;
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
