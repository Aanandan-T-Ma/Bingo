const socket = io()

const entryContainer = document.querySelector('.entry-container')
const gameContainer = document.querySelector('.game-container')
const playersList = document.querySelector('.players-list')
const bingoTable = document.querySelector('.bingo-table')
const startBtn = document.querySelector('.start-btn')
const readyBtn = document.querySelector('.ready-btn')
const currPlayer = document.querySelector('.curr-player')
var inputs, tds

var members = []
var curMember, turn, curMemberIndex
var striken = []

gameContainer.style.display = 'none'
startBtn.style.display = 'none'

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
    curMemberIndex = members.length - 1
    curMember = members[curMemberIndex]
    renderMembers()
})

socket.on('playerReady', data => {
    for(let i = 0; i < members.length; i++){
        if(members[i].id === data.id){
            members[i].ready = true
            break
        }
    }
    renderMembers()
    if (isAllReady()) {
        turn = -1
        readyBtn.style.display = 'none'
        startBtn.style.display = 'block'
    }
})

socket.on('strike', data => {
    for(let i = 0; i < inputs.length; i++){
        if(inputs[i].value == data.number){
            inputs[i].style.textDecoration = 'line-through'
            break
        }
    }
    striken[data.number-1] = true
    changeTurn()
})

socket.on('start', data => {
    for(let i = 0; i < tds.length; i++) 
        tds[i].onclick = strikeCell
    for(let i = 0; i < 25; i++)
        striken.push(false)
    startBtn.innerHTML = `Started By ${data.name} ${data.id === curMember.id ? '(You)' : ''}`
    startBtn.disabled = true
    changeTurn()
})

function enterRoom() {
    entryContainer.style.display = 'none'
    renderTable()
    gameContainer.style.display = 'flex'
    socket.emit('connectToRoom', { roomId: ROOM_ID, name: document.getElementById('name').value })
}

function renderTable() {
    bingoTable.innerHTML = ''
    for (let i = 0; i < 5; i++) {
        let tr = document.createElement('tr')
        for (let j = 0; j < 5; j++) {
            let td = document.createElement('td')
            let input = document.createElement('input')
            input.type = 'text'
            input.id = `cell-${i}-${j}`
            td.appendChild(input)
            tr.appendChild(td)
        }
        bingoTable.appendChild(tr)
    }
    inputs = bingoTable.querySelectorAll('input')
    tds = bingoTable.querySelectorAll('td')
}

function renderMembers(){
    playersList.innerHTML = ''
    members.forEach((member, index) => {
        playersList.innerHTML += `<li>${member.name} ${curMemberIndex === index ? '(You)' : ''} ${member.ready ? '&#10004;' : ''}</li>`
    })
}

function onReady() {
    let msg = checkInputs()
    if(msg !== ''){
        alert(msg)
        return
    }
    socket.emit('ready')
    readyBtn.disabled = true
    disableAllInputs()
}

function checkInputs() {
    let msg = ''
    let numbers = []
    for(let i = 0; i < inputs.length && msg === ''; i++){
        let value = inputs[i].value
        if (value === '') 
            msg = 'Fill all the cells'
        else if (isNaN(value))
            msg = 'Enter only Numbers'
        else if (value < 1 || value > 25)
            msg = 'Enter only Numbers from 1 to 25'
        numbers.push(Number(value))
    }
    numbers.sort((a,b) => a - b)
    for(let i = 0; i < numbers.length && msg === ''; i++){
        if (numbers[i] !== i + 1)
            msg = 'Fill all the numbers from 1 to 25'
    }
    return msg
}

function disableAllInputs() {
    for(let i = 0; i < inputs.length; i++){
        inputs[i].disabled = true
        inputs[i].style.cursor = 'pointer'
        tds[i].classList.add('td-ready')
    }
}

function isAllReady() {
    let allReady = true
    for(let i = 0; i < members.length && allReady; i++)
        if(!members[i].ready) 
            allReady = false
    return allReady
}

function onStart() {
    socket.emit('start', curMember)
}

function strikeCell(event) {
    console.log('before');
    if(turn !== curMemberIndex) return;
    console.log('after');
    let value = Number(document.getElementById(event.target.id).value)
    console.log(value);
    if(striken[value - 1]) return;
    socket.emit('strike', { id: curMember.id, number: value })
}

function changeTurn() {
    turn = (turn + 1) % members.length
    currPlayer.innerHTML = `Current Player: ${members[turn].name}`
}