const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

app.get('/', (req, res) => res.status(200).send({ message: 'success' }));

const server = http.createServer(app);

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', apiRoutes);

app.use((_, res) => res.status(404).send({
    error: '404 route not found',
}));

module.exports = server;