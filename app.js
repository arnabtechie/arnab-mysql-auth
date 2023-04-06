const express = require('express');
const config = require('./config.json');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.get('/', (req, res) => res.status(200).send({ status: 'success' }));

const server = http.createServer(app);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', apiRoutes);

app.use((_, res) => res.status(404).send({
    status: 'fail',
    errors: '404 not found',
}));

module.exports = server;