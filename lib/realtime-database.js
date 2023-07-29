const Firebase = require("firebase-admin");
const serviceAccount = require("./keys/credential.json")

Firebase.initializeApp({
    credential: Firebase.credential.cert( serviceAccount ),
    databaseURL: "https://slimedatabase-realtime-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const Database = Firebase.database();

module.exports = { Database };