let express = require('express');
let app = express();
let path = require('path');

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/data'));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + 'index.html'));
});

let port = 3000;
app.listen(3000);
console.log(`Listening on port ${ port }`)