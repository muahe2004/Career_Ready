const express = require('express');
const route = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const middleWare = require('../middleware')();
const { body, validationResult } = require('express-validator');

const JWT_SECRET = "kbhhdsbgvfsjkbfvjkabslcfhakjscbábkjcbfabs";
const pool = require('../initDB'); 


// Lấy danh sách users
route.get("/users", middleWare.requireToken, middleWare.requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');  
        return res.status(200).json(result.rows);  
    } catch (err) {
        return res.status(500).json({ message: "Lỗi khi lấy dữ liệu từ cơ sở dữ liệu", error: err });
    }
});

// Lấy theo ID
route.get("/users/:id", middleWare.requireToken, middleWare.requireSelfOrAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM users WHERE userid = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        return res.status(200).json(result.rows[0]);
    } catch (err) {
        return res.status(500).json({ message: "Lỗi khi lấy dữ liệu người dùng", error: err });
    }
});


// Thêm user mới
route.post('/users', [
    body('name').notEmpty().withMessage("Tên không được để trống"),
    body('email').isEmail().withMessage("Email không hợp lệ"),
    body('password').isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        // Kiểm tra nếu email đã tồn tại
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ message: "Email đã tồn tại!" });
        }

        const hashedPassword = bcrypt.hashSync(password, 12);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, hashedPassword, 'user']
        );

        return res.status(201).json({ message: "Tạo user thành công!", user: newUser.rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi khi tạo user", error: err });
    }
});

// Sửa
route.put('/users/:id', middleWare.requireToken, [
    body('name').optional().notEmpty().withMessage("Tên không hợp lệ"),
    body('email').optional().isEmail().withMessage("Email không hợp lệ"),
    body('role').optional().isIn(['admin', 'user']).withMessage("Vai trò không hợp lệ")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    try {
        const resultEmail = await pool.query('SELECT * FROM users WHERE email = $1 AND userid != $2', [email, id]);
        if (resultEmail.rows.length > 0) {
            return res.status(400).json({ message: "Email đã tồn tại!" });
        }

        const result = await pool.query(
            'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role) WHERE userid = $4 RETURNING *',
            [name, email, role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        return res.status(200).json({ message: "Cập nhật thành công!", user: result.rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi khi cập nhật người dùng", error: err });
    }
});

// Xóa người dùng
route.delete('/users/:id', middleWare.requireToken, middleWare.requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE userid = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User không tồn tại!" });
        }

        return res.status(200).json({ message: "Xóa thành công!", user: result.rows[0] });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi khi xóa người dùng", error: err });
    }
});

// Đăng nhập
route.post('/login', async function (req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ!" });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
        }

        const loginUser = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(password, loginUser.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
        }

        const token = jwt.sign(
            { id: loginUser.userid, name: loginUser.name, email: loginUser.email, role: loginUser.role },
            JWT_SECRET,
            { expiresIn: "10h" }
        );

        return res.status(200).json({ token });
    } catch (err) {
        console.error("Lỗi khi đăng nhập:", err);
        return res.status(500).json({ message: "Lỗi khi đăng nhập", error: err });
    }
});



module.exports = route;
