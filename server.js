const app = require('./app');
const config = require('./config');
const cluster = require('cluster');
require('./db');

const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
} else {
    process.on('uncaughtException', err => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err);
        process.exit(1);
    });

    const server = app.listen(config.PORT, () => {
        console.log(`server running on port ${config.PORT}...`);
    });

    process.on('SIGTERM', () => {
        console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
        server.close(() => {
            console.log('💥 Process terminated!');
        });
    });

    console.log(`Worker ${process.pid} started`);
}