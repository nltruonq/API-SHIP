const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv/config');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const authRoute = require('./routers/auth');
const userRoute = require('./routers/user');

const app = express();

app.use(
    cors({
        origin: '*',
        credentials: true,
        optionSuccessStatus: 200,
    }),
);
app.use(cookieParser());
app.use(express.json());

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.HOST,
        method: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);

    socket.on('join-room', (room) => {
        socket.join(room);
    });

    socket.on('message', (message) => {
        //Get room of socket arrayRoom[0]
        const roomIterator = socket.rooms.values();
        let arrayRoom = ['1'];
        for (const entry of roomIterator) {
            arrayRoom.push(entry);
            arrayRoom.shift();
        }

        socket.to(arrayRoom[0]).emit('message', message);
    });

    socket.on('shipLocationArray', (shipLocationArray) => {
        const roomIterator = socket.rooms.values();
        let arrayRoom = ['1'];
        for (const entry of roomIterator) {
            arrayRoom.push(entry);
            arrayRoom.shift();
        }

        socket.to(arrayRoom[0]).emit('enemyLocationArray', shipLocationArray);
    });

    socket.on('fire', (mess) => {
        const roomIterator = socket.rooms.values();
        let arrayRoom = ['1'];
        for (const entry of roomIterator) {
            arrayRoom.push(entry);
            arrayRoom.shift();
        }

        socket.to(arrayRoom[0]).emit('fire', 'your turn');
    });

    socket.on('you-first', () => {
        const roomIterator = socket.rooms.values();
        let arrayRoom = ['1'];
        for (const entry of roomIterator) {
            arrayRoom.push(entry);
            arrayRoom.shift();
        }

        socket.to(arrayRoom[0]).emit('you-first', 'your turn');
    });

    socket.on('win', () => {
        const roomIterator = socket.rooms.values();
        let arrayRoom = ['1'];
        for (const entry of roomIterator) {
            arrayRoom.push(entry);
            arrayRoom.shift();
        }

        socket.to(arrayRoom[0]).emit('win', 'ban thua roi');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

mongoose.connect(process.env.MONGODB_URL, () => {
    console.log('Mongodb is connected');
});

app.use('/v1/auth', authRoute);
app.use('/v1/user', userRoute);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log('Server is running on port:', PORT);
});
