const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const path = require('path');
const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require("./serviceAccountKey.json");

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'log.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'registration.html'));
});
app.post('/login', (req, res) => {
    const { userName, password } = req.body;

    db.collection('Loginpage').where('userName', '==', userName).where('password', '==', password).get()
        .then((snapshot) => {
            if (snapshot.empty) {
                res.status(401).json({ error: 'Invalid userName or password' });
            } else {
                const user = snapshot.docs[0].data();
                res.status(200).json({ message: 'Login successful', username: user.userName });
            }
        })
        .catch((error) => {
            console.error("Error during login:", error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

app.post('/signup', (req, res) => {
    const userData = req.body;
    
    db.collection('Loginpage').add(userData)
        .then((docRef) => {
            console.log('User added with ID: ', docRef.id);
            res.status(201).json({ success:true,message: "User added successfully", username: userData.userName });
        })
        .catch((error) => {
            console.error("Error adding user:", error);
            res.status(500).json({ error: "Internal Server Error" });
        });
});

app.get('/interface', (req, res) => {
    res.render('interface');  
})
app.listen(8080, () => {
    console.log('server is running on http://localhost:8080');
});
