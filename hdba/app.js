//@ts-check
const express = require("express");
const http = require("http");
const websocket = require("ws");

const indexRouter = require("./routes/index");  

// @ts-ignore
const port = process.argv[2];
const app = express();

app.set("view engine", "ejs"); /*CHECK*/
// @ts-ignore
app.use(express.static(__dirname + "/public"));
const server = http.createServer(app);

app.get("/", indexRouter);

console.log("starting server!")

const wss = new websocket.Server({server});
  
let gameInstances = [];
let players = [];



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
class GameInstance{
  constructor(id){
    this.id = id;
    this.players = [];
    this.gameState = 0;
    this.pawns = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    this.currentDice = 0;
    this.currentPlayer = 0;
  }
}

class Player{
  constructor(playerID, gameInstance, ws, playern){
    this.playerID = playerID; /* player ID */
    this.gameInstance = gameInstance; /* gameInstance*/
    this.ws = ws; /* current websocket */
    this.playern = playern; /* Player number ingame: between 1 and 4 */
  }
}


let gameInstance = new GameInstance(1);
console.log(gameInstance.id);

wss.on("connection", function(ws){
  
  setTimeout(function(){
    console.log("Connection state: " + ws.readyState);
    ws.send("Thanks for the message. --Server");
    // ws.close();
    console.log("Connection status: " + ws.readyState);
  }, 2000);

  ws.on("message", function incoming(message){
    let stringmessage = "" + message;
    let type = stringmessage.split("-")[0];
    let data = stringmessage.split("-")[1];
    // console.log(stringmessage);
    if(type == "0"){
      console.log("A new player has tried connecting to server!");
      if(gameInstances.length == 0 || gameInstances[gameInstances.length - 1].players.length >= 4 || gameInstances[gameInstances.length - 1].gameState != 0){
        gameInstances.push(new GameInstance(gameInstances.length));
        console.log("Created new game instance with id: " + gameInstances[gameInstances.length-1].id);
      }
      let playerID = players.length;
      let gameInstance = gameInstances[gameInstances.length - 1];
      let playerNumber = gameInstance.players.length + 1;
      let player = new Player(playerID, gameInstance, ws, playerNumber);
      gameInstances[gameInstances.length - 1].players.push(player);
      console.log(gameInstances[gameInstances.length - 1].players);
      console.log("Player with ID: " + playerID + " joined gameInstance ID: " + gameInstance.id);
      
      ws.send("0-" + playerNumber);
      players.push(player);
      if(gameInstance.players.length == 4){
        gameInstance.currentPlayer = 1;
        gameInstance.players.forEach(element => {
          gameInstance.gameState = 1;
          element.ws.send("1-1");
          gameInstance.gameState = 2;
          gameInstance.currentPlayer = 1;
          element.ws.send("2-1");
        });
      }else{
        gameInstance.players.forEach(element => {
          element.ws.send("1-0=" + gameInstance.players.length);
        });
      }


    }

    if(type == "1"){
      let playerID = -1;
      for(var i = 0; i < players.length; ++i){
        if(ws == players[i].ws) playerID = players[i].playerID;
      }
      let currPlayer = players[playerID];
      console.log("Dice of " + data + " thrown by player ID: " + playerID + 
      "\nGame Instance ID: " + currPlayer.gameInstance.id + 
      "\nPlayer number: " + currPlayer.playern);
      currPlayer.gameInstance.currDice = parseInt(data);
    }

    if(type == "2"){

    }

    if(type == "3"){
      let playerID = -1;
      for(var i = 0; i < players.length; ++i){
        if(ws == players[i].ws) playerID = players[i].playerID;
      }
      let currPlayer = players[playerID];
      console.log("Pawn N: " + data + " moved by player ID: " + playerID);
      let currPlace = currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1];
      if(currPlace == 0){
        console.log("Pawn moved to home!");
        currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1] = (currPlayer.playern -1 ) * 10 + 1;
      }else{
        currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1] = (currPlace + currPlayer.gameInstance.currDice)%41;
      }
       
      /*command: type: 2, pawnPlayer: 1-4, pawnNumber: 1-4, boardPlace: 1-40 */
      let message = "3-" + currPlayer.playern + "=" + data + "=" + currPlayer.gameInstance.pawns[currPlayer.playern - 1][parseInt(data) - 1];
      console.log(currPlayer.gameInstance.players);
      currPlayer.gameInstance.players.forEach(element => {
        console.log("message sent: " + message);
        element.ws.send(message);
      });
    }

  });

  ws.on("close", function(code){
    let playerID = -1;
      for(var i = 0; i < players.length; ++i){
        if(ws == players[i].ws) playerID = players[i].playerID;
      }
      console.log("Player ID: " + playerID + " left!");
      players[playerID].gameInstance.gameState = "4-0";
      players[playerID].gameInstance.players.forEach(element => {
        element.ws.send("1-4=0");
      });
  });

  

});

server.listen(port);