const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');


exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({
        status: 'fail',
        error: errors,
      });
    }

    const { email, password, full_name } = req.body;

    try {
        const user = await db.query('select id from users where email = ?', email);
        if (user && user [0] && user [0].length > 0) {
            return res.status(400).send({
                status: 'fail',
                message: 'user exists, try logging in'
            });
        }

        const hashPassword = await bcrypt.hash(password, 12);

        const result = await db.query('insert into users (email, full_name, password) values (?, ?, ?)', [email, full_name, hashPassword]);
        if (result && result[0]) {
            const token = jwt.sign({ id: result[0].insertId }, config.JWT_SECRET, {
                expiresIn: 86400 * 30
            });

            return res.status(201).send({
                status: 'success',
                message: 'user added successfully',
                data: {
                    id: result[0].insertId,
                    token
                }
            });
        }

        return res.status(400).send({ status: 'fail', error: 'something went wrong' })

    } catch (err) {
        return res.status(500).send({ status: 'fail', error: err.toString() });
    }
};

exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({
        status: 'fail',
        error: errors,
      });
    }
    const { email, password } = req.body;

    try {
        const [user, schema] = await db.query('select id, email, full_name, password from users where email = ?', email);

        if (!user || (user && !user[0])) {
            return res.status(400).send({
                status: 'fail',
                message: 'invalid credentials'
            });
        }
    
        const isMatch = await bcrypt.compare(password, user[0].password);
    
        if (!isMatch) {
            return res.status(400).send({
                status: 'fail',
                message: 'invalid credentials'
            });
        }
    
        const token = jwt.sign({ id: user[0].id }, config.JWT_SECRET);
    
        return res.status(200).send({
            status: 'success',
            data: {
                id: user[0].id,
                full_name: user[0].full_name,
                email: user[0].email,
                token
            }
        });
    } catch (err) {
        return res.status(500).send({ status: 'fail', error: err.toString() });
    }
};

exports.logout = async (req, res) => {
    return res.status(200).json({ status: 'success' });
};

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers && req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers && req.headers.authorization) {
        token = req.headers.authorization;
    }

    if (!token) {
      return res.status(401).send({
        status: 'fail',
        error: 'you are not logged in! please log in to get access',
      });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
    
        if (!decoded) {
            return res.status(401).send({
                status: 'fail',
                error: 'unauthorized',
            });
        }
    
        const [user, schema] = await db.query('select id, email, full_name from users where id = ?', decoded.id);
    
        if (!user || (user && !user[0])) {
          return res.status(401).send({
            status: 'fail',
            message: 'user belonging to this token does no longer exist',
          });
        }
    
        req.user = user[0];
        res.locals.user = user[0];
        next();
    } catch (err) {
        return res.status(500).send({ status: 'fail', error: err.toString() });
    }
};