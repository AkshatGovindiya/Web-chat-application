const express = require("express");
const fs = require('fs');
const http = require("http");
const Server = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = Server(server);

const activeUsers = new Map();


io.on('connection', (socket) => {

    console.log('A new user connected with id:', socket.id);

    socket.on('joined', (name) => {
        activeUsers.set(socket.id, name);
        socket.broadcast.emit('userJoined', `${name} has joined`);
        io.emit('active-users', Array.from(activeUsers.values()));
    })

    socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);

    });

    socket.on('message', ({ message, room }) => {
        const senderName = activeUsers.get(socket.id);
        io.to(room).emit('user-message', { message, senderId: socket.id, senderName });
        console.log(socket.id)
    });

    socket.on('send-photo', ({ imageData }) => {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const fileName = `image_${Date.now()}.png`;
        fs.writeFile(fileName, base64Data, { encoding: 'base64' }, (err) => {
            if (err) {
                console.error('Error saving image:', err);
            } else {
                console.log('Image saved successfully:', fileName);
            }
        });
        const senderName = activeUsers.get(socket.id);
        io.emit('receive-photo', ({ imageData,senderId: socket.id,senderName}));
    })

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        activeUsers.delete(socket.id);
        io.emit('active-users', Array.from(activeUsers.values()));
    });

});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
})

server.listen("3333", () => console.log('server started at 3333'))