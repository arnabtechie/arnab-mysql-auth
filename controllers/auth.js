const db = require('../db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      error: errors,
    });
  }

  const { email, password, fullName, confirmPassword } = req.body;

  if (confirmPassword !== password) {
    return res.status(400).send({
      error: 'Password and Confirm Password are different',
    });
  }

  const connection = await db.getConnection();

  try {
    const [user] = await connection.query(
      'select id from users where email = ?',
      email
    );
    if (user && user[0]) {
      return res.status(400).send({
        error: 'User exists, try logging in',
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const result = await connection.query(
      'insert into users (email, full_name, password) values (?, ?, ?)',
      [email, fullName, hashPassword]
    );
    if (result && result[0]) {
      const token = jwt.sign({ id: result[0].insertId }, config.JWT_SECRET, {
        expiresIn: 86400 * 30,
      });

      return res.status(201).send({
        message: 'User registered successfully',
        id: result[0].insertId,
        token,
      });
    }

    connection.release();

    return res.status(400).send({ error: 'Something went wrong' });
  } catch (err) {
    if (connection) {
      connection.release();
    }
    return res.status(500).send({ error: err.toString() });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({
      error: errors,
    });
  }
  const { email, password } = req.body;

  const connection = await db.getConnection();

  try {
    const [user] = await connection.query(
      'select id, email, full_name, password from users where email = ?',
      email
    );

    if (!user || (user && !user[0])) {
      return res.status(400).send({
        error: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(400).send({
        error: 'Invalid credentials',
      });
    }

    const token = jwt.sign({ id: user[0].id }, config.JWT_SECRET);

    connection.release();

    return res.status(200).send({
      message: 'User logged in successfully',
      id: user[0].id,
      full_name: user[0].full_name,
      email: user[0].email,
      token,
    });
  } catch (err) {
    if (connection) {
      connection.release();
    }
    return res.status(500).send({ error: err.toString() });
  }
};

exports.logout = async (req, res) => {
  return res.send(200).send({ message: 'User logged out successfully' });
};

exports.user = async (req, res) => {
  const connection = await db.getConnection();

  const [user] = await connection.query(
    'select id, email, full_name, created_at from users where id = ?',
    req.user.id
  );

  connection.release();

  if (user && user[0]) {
    return res.status(200).json({ ...user[0] });
  }
  return res.status(400).send({
    error: 'Invalid user',
  });
};

exports.profile = async (req, res) => {
  const connection = await db.getConnection();

  const [user] = await connection.query(
    'select id, email, full_name, created_at from users where id = ?',
    req.user.id
  );

  connection.release();
  if (user && user[0]) {
    return res.status(200).json({ ...user[0] });
  }
  return res.status(400).send({
    error: 'Invalid user',
  });
};
