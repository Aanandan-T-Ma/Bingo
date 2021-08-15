const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const logger = require('morgan');
const functions = require('./functions');

const PORT = process.env.PORT || 3000;

const idGenerator = functions.getNewId();

app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.redirect(`/${idGenerator.next().value}`);
})

app.get('/:roomId', (req, res) => {
    res.render('game', { roomId: req.params.roomId });
});

io.on('connection', socket => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('connectToRoom', data => {
        socket.join(data.roomId);
        socket.roomId = data.roomId;
        socket.name = data.name;
        socket.ready = false;
        io.sockets.in(data.roomId).emit('newClient', { id: socket.id, name: data.name, ready: false })
        io.to(socket.id).emit('members', getClients(socket.roomId))
    })

    socket.on('leaveRoom', () => {
        io.sockets.in(socket.roomId).emit('clientLeft', { id: socket.id })
        socket.leave(socket.roomId);
    })
    
    socket.on('disconnect', () => {
        socket.join(socket.roomId);
        io.sockets.in(socket.roomId).emit('clientLeft', { id: socket.id })
        socket.leave(socket.roomId);
        console.log('A user disconnected!')
    })

    socket.on('ready', () => {
        socket.ready = true;
        io.sockets.in(socket.roomId).emit('playerReady', { id: socket.id })
    })

    socket.on('strike', data => {
        io.sockets.in(socket.roomId).emit('strike', data)
    })

    socket.on('start', data => {
        io.sockets.in(socket.roomId).emit('start', data)
    })
})

function getClients(roomId) {
    let clients = []
    const clientIds = io.sockets.adapter.rooms.get(roomId);
    clientIds.forEach(clientId => {
        const clientSocket = io.sockets.sockets.get(clientId);
        clients.push({
            id: clientSocket.id,
            name: clientSocket.name,
            ready: clientSocket.ready
        })
    })
    return clients
}

http.listen(PORT, console.log(`Server running at port ${PORT}`));