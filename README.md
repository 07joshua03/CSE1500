# CSE1500
A web game of 'Ludo' using Express and ES6 JS
Made by 07Joshua03 and SophieVDL

![image](https://user-images.githubusercontent.com/8020494/148620393-5ef8888a-08c0-44ac-96c8-9dccf98dbef3.png)

## Installation
```
'Go inside of hdba folder'
'npm install .'
'npm start'


## Bugs
1 - When player 2(blue) is moving from place 10(just before dest squares) into dest via throw server-side is correct yet client-side displays incorrectly

2 - When one is put back to home, BoardPlace isn't set back to 0, which means next time it moves out of home it goes to random ass places


Gameplay:

1. Player throws a dice. Whenever a 6 is thrown, you may place a pawn onto the board. Otherwise you may move 1 pawn so many spaces.
2. Make a move (if you can.) Whenever your pawn would land on another's, you kill them and send them back to their home square.
3. The goal is to get all 4 of your pawns to your street by walking them around the board. Goodluck!