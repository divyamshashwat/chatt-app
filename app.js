// app.js

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// List to store available topics
let topics = [];

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/set-username', (req, res) => {
    const username = req.body.username;
    res.render('choose_topic', { username: username, topics: topics });
});

app.post('/create-topic', (req, res) => {
    const topic = req.body.topic;
    const username = req.body.username;
    if (topic && !topics.includes(topic)) {
        topics.push(topic);
        // Redirect to the chat room for the new topic
        res.redirect(`/chat/${encodeURIComponent(topic)}/${encodeURIComponent(username)}`);
    } else {
        res.render('choose_topic', { username: username, topics: topics });
    }
});

app.get('/chat/:topic/:username', (req, res) => {
    const topic = req.params.topic;
    const username = req.params.username;
    res.render('chat', { topic: topic, username: username });
});

// Socket.IO event handling
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle joining a room
    socket.on('join', (data) => {
        const username = data.username;
        const room = data.room;
        socket.join(room);
        if (username) {
            io.to(room).emit('message', { username: 'System', msg: `${username} has entered the room.` });
        } else {
            io.to(room).emit('message', { username: 'System', msg: 'A user has entered the room.' });
        }
    });

    // Handle incoming messages
    socket.on('message', (data) => {
        const room = data.topic;
        const msg = data.msg;
        const username = data.username;
        if (msg && username) {
            io.to(room).emit('message', { username: username, msg: msg });
        } else {
            io.to(room).emit('message', { username: 'System', msg: 'A message was sent, but some data was missing.' });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
