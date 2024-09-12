const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
const db = getFirestore();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('images'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'log.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'registration.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { userName, password } = req.body;

    db.collection('Loginpage')
        .where('userName', '==', userName)
        .where('password', '==', password)
        .get()
        .then((snapshot) => {
            if (snapshot.empty) {
                return res.status(401).json({ error: 'Invalid userName or password' });
            }

            const user = snapshot.docs[0].data();
            res.status(200).json({ message: 'Login successful', username: user.userName });
        })
        .catch((error) => {
            console.error("Error during login:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Handle signup
app.post('/signup', (req, res) => {
    const userData = req.body;

    db.collection('Loginpage')
        .add(userData)
        .then((docRef) => {
            console.log('User added with ID:', docRef.id);
            res.status(201).json({ success: true, message: "User added successfully", username: userData.userName });
        })
        .catch((error) => {
            console.error("Error adding user:", error);
            res.status(500).json({ error: "Internal Server Error" });
        });
});

// Serve user interface
app.get('/interface', (req, res) => {
    res.render('interface');
});

// Handle animal search request with POST (for receiving search term)
app.post('/search', (req, res) => {
    const { speciesName } = req.body;
    console.log('Search term received:', speciesName);

    if (speciesName) {
        res.status(201).json({ message: "Search term received", speciesName });
    } else {
        res.status(404).json({ error: 'Species name not provided' });
    }
});

// Handle animal search request with GET (for fetching from external API)
app.get('/search', (req, res) => {
    const { speciesName } = req.query;

    if (!speciesName) {
        return res.status(400).send('Bad Request: No species name provided.');
    }

    const apiUrl = `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(speciesName)}`;
    const apiKey = '0A5zW2uDWmEzJD0xmiaYJQ==fUlW6DZJkMuJWNie'; 

    request({ url: apiUrl, json: true, headers: { 'X-Api-Key': apiKey } }, (err, response, body) => {
        if (err || !body) {
            console.error('Error fetching data from API:', err);
            return res.status(500).send('Internal Server Error: Failed to fetch data from API.');
        }

        if (!body.length) {
            return res.status(404).send('No data found for the given species.');
        }
        res.render('result', { wildlife: body[0] });

    });
});

// Start the server
app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
