# Solariboard

Simple project to diplay messages on an airport-like display. 

![screenshot](https://cdn.glitch.com/0ed38d3c-4987-4983-a3f0-2347c4bf05e6%2Fscreenshot.png)

The front is based on the project [Solariboard](https://github.com/carlmw/SolariBoard) by Carlmw on Github.  

It uses a text-wrapping function to make sure the words aren't cut in the middle (unless they're rally too long). 

## What does it do?

- It shows messages on the index.html 
- The page /message allows you to add new messages and delete previous ones 

### Behavior 

It flips through the list of messages, updating the board each time. It starts by the last message and then the most recent one and so on... Then it starts back at the begining. 
If there is no message, it will play a message that gives the address where messages can be sent. 

### Customization 

You can modify:

- the number of rows and lines in the index.html
- the 'zoom' in the app/solari.js file
- the time (in ms) messages are shown on the index.html
- the info message that appears at the bottom of the screen in index.html
- the message when there are no messages 
- the characters, but that happens with a .psd file (in assets)

### Going forward 

- Add sound that fits the flipping
- Button to exit fullscreen 
- Security for the /message page 
- Better moderating rights 
- Give messages a duration before which they expire 
- Fetch internet info (weather, rss, Twitter, etc.)

### Limits 

- For some reason, the board doesn't work on mobile / tablet... 
- You can play a sound each time a letter flips (too heavy) 

## Made with [Glitch](https://glitch.com/)

\ ゜ o ゜)ノ
