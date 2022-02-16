require('dotenv').config()
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const router = require('./router')
const db = require('./models')

const app = express();

app.use(morgan('combined'));
app.use(bodyParser.json({ type: '*/*'}));
app.use(cors());
router(app);

const port = process.env.PORT || 3090;
const server = http.createServer(app);

db.sequelize.sync()

server.listen(port);
console.log('server listening on port: ', port);
