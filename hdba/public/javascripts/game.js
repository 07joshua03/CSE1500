//@ts-check

class Message{
    constructor(type, data){
      this.type = type;
      this.data = data;
    }
}

const url = window.location.hostname;
const result = url.replace(/(^\w+:|^)\/\//, '');
console.log(result);
const gameinfoele = document.getElementById("gameinfo");
const socket = new WebSocket("wss://" + result); 

let playerNumber = -1;
let currdice = 0;
let currPawn;
let gameState = 0;
let currentPlayer = 0;

let playerColors = [
    {color: "#949BA6", name: "GRAY"}, 
    {color: "#2A5CBF", name: "BLUE"}, 
    {color: "#011126", name: "DARKBLUE"},
    {color: "#45648C", name: "GRAYBLUE"}
]

socket.onmessage = function(event){
    console.log(event.data);
    let type = event.data.split("-")[0];
    let data = event.data.split("-")[1];

    //INITIAL CONNECTION (RECEIVE PLAYER NUMBER/COLOR)
    if(type == "0"){
        playerNumber = parseInt(data);
        
        let name = playerColors[playerNumber-1].name;
        const playerinfo2element = document.getElementById("playerinfo2");
        const playercolorelement = document.getElementById("playercolor");
        playercolorelement.style.color = playerColors[playerNumber-1].color;
        playercolorelement.style.fontWeight = "bold";
        playerinfo2element.innerHTML = "You're ";
        playercolorelement.innerHTML = name;
    }

    //RECEIVE NEW GAME STATUS
    if(type == "1"){
        if(data.startsWith("0")){
            gameinfoele.innerHTML = data.split("=")[1] + " Player(s) waiting for game to start...";
        }
        if(data == "1"){
            gameState = 1;
            console.log("Game is starting... Initializing pawns");
            gameinfoele.innerHTML = "Game is starting...";
            initpawns();

        }

        if(data.startsWith("4")){
            gameState = 4;
            let finishreason = data.split("=")[1];
            if(finishreason == "0"){
                gameinfoele.innerHTML = "Player left! Aborting game...";
                /* TODO MAKE PAGE GO BACK TO SPLASH SCREEN */

            }
        }
    }

    //RECEIVE A MOVE
    if(type == "3"){
        console.log("command of type 2 received: "+ event.data);
        let pawnPlayer = data.split("=")[0];
        let pawnNumber = data.split("=")[1];
        let newBoardPlace = data.split("=")[2];
        let movedPawn = document.getElementById("pawn-" + pawnPlayer + "-" + pawnNumber);
        movedPawn.setAttribute("boardPlace", newBoardPlace);
        let correctBox = document.getElementById("box-" + newBoardPlace);
        movedPawn.style.gridRow = correctBox.style.gridRow;
        movedPawn.style.gridColumn = correctBox.style.gridColumn;
    }
    //target.innerHTML = event.data;
};



socket.onopen = function(){
    socket.send("0-null");
    console.log("sent request");
    gameinfoele.innerHTML = "Requesting to connect to server...";
};

let throwdice = async function(){
    const play = Math.floor(Math.random() * 6) + 1;
    currdice = play;
    let arr = [6,3,1,5,4,2];
    // for(var i = 0; i < 2; ++i){
    //     for(var j = 0; j <= 5; ++j){
    //         let beforedice = "images/" + arr[j] + "dice.svg";
    //         document.getElementById("diceimage").setAttribute("src", beforedice);
    //         await sleep(200);
    //     }
    // }
    const newdice = "images/" + play + "dice.svg";
    document.getElementById("diceimage").setAttribute("src", newdice);
    document.getElementById("diceimage").setAttribute("value", newdice);

    socket.send("1-" + play);
    console.log("Sent dice data!");

};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initpawns(){
    let startingpositions = [[
        {x: 1, y: 10},
        {x: 1, y: 11},
        {x: 2, y: 10},
        {x: 2, y: 11}
    ], [
        {x: 1, y: 1},
        {x: 1, y: 2},
        {x: 2, y: 1},
        {x: 2, y: 2}
    ], [
        {x: 10, y: 1},
        {x: 10, y: 2},
        {x: 11, y: 1},
        {x: 11, y: 2}
    ], [
        {x: 10, y: 10},
        {x: 10, y: 11},
        {x: 11, y: 10},
        {x: 11, y: 11}
    ]]

    for(var j = 1; j < 5; j++){
        for(var i = 1; i < 5; ++i){
            let id = "pawn-" + j + "-" + i;
            let currpawn = document.getElementById(id);
            currpawn.style.gridRow = startingpositions[j - 1][i - 1].y.toString();
            currpawn.style.gridColumn = startingpositions[j - 1][i - 1].x.toString();
            currpawn.style.visibility = "visible";
            
        }
    }
}   


let movepawn = function(pawn){
    let newPawn = document.getElementById("pawn-" + pawn);
    if(typeof currPawn !== "undefined"){
        if(currPawn != newPawn){
            currPawn.style.backgroundColor = "black";
        }
    }
    currPawn = newPawn;
    let pawnPlayer = pawn.split("-")[0];
    let pawnNumber = pawn.split("-")[1];
    if(pawnPlayer == playerNumber){
        if(currPawn.getAttribute("boardPlace") == undefined){
            if(currdice == 6){
                currPawn.style.backgroundColor = "red";
                let homeSquare = document.getElementById("box-" + ((playerNumber - 1) * 10 + 1));
                let highlightedSquare = document.getElementById("highlighted-1");
                highlightedSquare.style.gridRow = homeSquare.style.gridRow;
                highlightedSquare.style.gridColumn = homeSquare.style.gridColumn;
                highlightedSquare.style.visibility = "visible";
            }
        }else{
            let currPlace = parseInt(currPawn.getAttribute("boardPlace"));
            let highlightedSquare = document.getElementById("highlighted-1");
            console.log((currPlace + currdice)%41);

            let newSquare = document.getElementById("box-" + (currPlace + currdice)%41);
            highlightedSquare.style.gridRow = newSquare.style.gridRow;
            highlightedSquare.style.gridColumn = newSquare.style.gridColumn;
            highlightedSquare.style.visibility = "visible";
        }

    }else{
        console.log("invalid pawn chosen!");
    }
}

let confirmmove = function(){
    let infoarray = currPawn.getAttribute("id").split("-");
    currPawn.style.backgroundColor = "black";
    let pawnPlayer = infoarray[1];
    let pawnNumber = infoarray[2];
    let message = "3-" + pawnNumber;
    socket.send(message);
    console.log("Server command sent: " + message);
    let highlightedSquare = document.getElementById("highlighted-1");
    highlightedSquare.style.visibility = "hidden";
}
