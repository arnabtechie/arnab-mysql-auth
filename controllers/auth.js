const db = require('../db');
const jwt = require('jsonwebtoken');
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

    const { email, password, full_name, confirmPassword } = req.body;

    if (confirmPassword !== password) {
        return res.status(400).send({
            status: 'fail',
            message: 'password and confirmPassword are different'
        });
    }

    try {
        const [user] = await db.query('select id from users where email = ?', email);
        if (user && user[0]) {
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
        const [user] = await db.query('select id, email, full_name, password from users where email = ?', email);

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

exports.profile = async (req, res) => {
    const [user] = await db.query('select id, email, full_name, created_at from users where id = ?', req.user.id);
    if (user && user[0]) {
        return res.status(200).json({ status: 'success', data: user[0] });
    }
    return res.status(400).send({
        status: 'fail',
        message: 'invalid id'
    });
};