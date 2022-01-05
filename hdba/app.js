const express = require("express");
const http = require("http");
const websocket = require("ws");

const port = process.argv[2];
const app = express();

app.use(express.static(__dirname + "/public"));
const server = http.createServer(app);

console.log("starting server!")

const wss = new websocket.Server({server});

let gameInstances = [];
let players = [];

class GameInstance{
  constructor(id){
    this.id = id;
    this.players = [];
  }
}

class Player{
  constructor(playerID, gameInstanceID, ws){
    this.playerID = playerID;
    this.gameInstance = gameInstanceID;
    this.ws = ws;
  }
}

//NEEDS TO BE RAN EVERY TIME NEW PLAYER JOINS


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
    if(type == 0){
      console.log("A new player has tried connecting to server!");
      if(gameInstances.length == 0 || gameInstances[gameInstances.length - 1].players.length >= 4){
        gameInstances.push(new GameInstance(gameInstances.length));
        console.log("Created new game instance with id: " + gameInstances[gameInstances.length-1].id);
      }
      let playerID = players.length;
      let gameInstanceID = gameInstances.length - 1;
      let player = new Player(playerID, gameInstanceID, ws);
      gameInstances[gameInstances.length - 1].players.push(player);
      players.push(player);
      console.log("Player with ID: " + playerID + " joined gameInstance ID: " + gameInstanceID);
      ws.send("0-success")
    }

    if(type == 1){
      let playerID = -1;
      for(var i = 0; i < players.length; ++i){
        if(ws == players[i].ws) playerID = players[i].playerID;
      }
      if(playerID == 0){
        console.log("here we go");
        players[1].ws.send("hihi-");
      }
      console.log("Dice thrown by player ID:" + playerID);
    }
  });

  ws.on("close", function(code){
    let playerID = -1;
      for(var i = 0; i < players.length; ++i){
        if(ws == players[i].ws) playerID = players[i].playerID;
      }
      console.log("Player ID: " + playerID + " left!");
  });

  

});

server.listen(port);