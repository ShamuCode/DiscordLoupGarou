const mysql = require('promise-mysql');

module.exports = (client) => new Promise((resolve, reject) => {

    mysql.createConnection({
        host: process.env.mysqlHost,
        user: process.env.mysqlUser,
        password: process.env.mysqlPassword,
        port: process.env.mysqlPort,
        connectTimeout: 60000
    }).then(conn => {
        client.DB = conn;
        resolve(conn);
    }).catch(err => reject(err));

});