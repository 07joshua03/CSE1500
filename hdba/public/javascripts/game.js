class Message{
    constructor(type, data){
      this.type = type;
      this.data = data;
    }
  }
const url = window.location.hostname;
const result = url.replace(/(^\w+:|^)\/\//, '');
console.log(result);
const target = document.getElementById("test2");
const socket = new WebSocket("wss://" + result); 

let isSuccess = false;

socket.onmessage = function(event){
    console.log(event.data);
    if(event.data.split("-")[0] == "hihi"){
        var ele = document.getElementById("titleheader");
        ele.style.fontSize = "60px";
        ele.innerHTML = "HOI SOPHIE";
    }
    if(event.data.split("-")[1] == "success"){
        console.log("Successfully connected to server!");
        isSuccess = true;
    }
    target.innerHTML = event.data;
};



socket.onopen = function(){
    socket.send("0-null");
    console.log("sent request");
    target.innerHTML = "Requesting to connect to server...";
};

throwdice = async function(){
    const play = Math.floor(Math.random() * 6) + 1;
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

    if(isSuccess){
        socket.send("1-" + play);
        console.log("Sent dice data!");
    }

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
            currpawn.style.gridRow = startingpositions[j - 1][i - 1].y;
            currpawn.style.gridColumn = startingpositions[j - 1][i - 1].x;
            currpawn.style.visibility = "visible";
        }
    }
}   

