const socket = io()

const entryContainer = document.querySelector('.entry-container')
const gameContainer = document.querySelector('.game-container')
const playersList = document.querySelector('.players-list')
const bingoTable = document.querySelector('.bingo-table')
const input = document.getElementById('name')

var members = []

gameContainer.style.display = 'none'

function enterRoom() {
    entryContainer.style.display = 'none'
    gameContainer.style.display = 'flex'
    socket.emit('connectToRoom', { roomId: ROOM_ID, name: input.value })
}

socket.on('newClient', data => {
    members.push(data)
    console.log('New client');
    console.log(data);
    console.log(members);
    renderMembers()
})

socket.on('clientLeft', data => {
    members = members.filter(m => m.id !== data.id)
    console.log('Remaining');
    console.log(members);
    renderMembers()
})

socket.on('members', data => {
    members = data
    console.log('Members');
    console.log(members);
    renderMembers()
})

function renderMembers(){
    playersList.innerHTML = ''
    members.forEach(member => {
        playersList.innerHTML += `<li>${member.name}</li>`
    })
}