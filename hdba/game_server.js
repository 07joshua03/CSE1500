//@ts-check

const websocket = require("ws");

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

const newPlayer = function(){
    
}
