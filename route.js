const express = require('express');
const route = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const middleWare = require('./middleware')();
const { body, validationResult } = require('express-validator');

const JWT_SECRET = "kbhhdsbgvfsjkbfvjkabslcfhakjscbábkjcbfabs";

const users = [
    {
        id: "u001",
        userName: "admin1", // 123456
        password: "$2a$12$cUCO/CZJPIA58fqC3bpojO6pDgeC1ddrwisV4FVn1hTEYC8Z5ZPlS",
        email: "admin1@example.com",
        role: 'admin',
        name: "Ming"
    },
    {
        id: "u002",
        userName: "admin2", // 654321
        password: "$2a$12$XcdCXkiU4pOfuDb.zOPXQefldWdqQre8zeMkLoBYFhZhIdFm5mNMS",
        email: "admin2@example.com",
        role: "admin",
        name: "John"
    },
    {
        id: "u003",
        userName: "alice", // 280504
        password: "$2a$12$NyD9k//pbLOdW3MmAKk.p.YaPX2HOabGsKP/58ybCNHkMAyUbGNJ.",
        email: "user1@example.com",
        role: "user",
        name: "Alice"
    },
    {
        id: "u004",
        userName: "bobbob", // 270104
        password: "$2a$12$XH/C2rvvbRcjY0dx96ReY.3Noj9mjCkb0nhbr0xgY8Sd3UYc9/4Dy",
        email: "user2@example.com",
        role: "user",
        name: "Bob"
    },
    {
        id: "u005",
        userName: "chaly", // 181122
        password: "$2a$12$UXhKh5g7VHxaBc6pNUrpfeyj5H6ZnNfKMDmX5tFylCieQQ9f26Wom",
        email: "user3@example.com",
        role: "user",
        name: "Charlie"
    }
];

// Lấy danh sách users
route.get("/users", middleWare.requireToken, middleWare.requireAdmin, (req, res) => {
    return res.status(200).json(users);
});

// Lấy theo ID
route.get("/users/:id", middleWare.requireToken, middleWare.requireSelfOrAdmin, (req, res) => {
    const { id } = req.params;

    const user = users.find(u => u.id === id);

    if (!user) {
        return res.status(404).json({ message: "User không tồn tại!" });
    }

    return res.status(200).json(user);
});

// Thêm user mới
route.post('/users', [
    body('userName').notEmpty().withMessage("Tên đăng nhập không được để trống"),
    body('name').notEmpty().withMessage("Tên không được để trống"),
    body('email').isEmail().withMessage("Email không hợp lệ"),
    body('password').isLength({ min: 6 }).withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userName, name, email, password } = req.body;

    if (users.some(u => u.email === email)) {
        return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);

    const newUser = {
        id: `u00${users.length + 1}`,
        userName,
        name,
        email,
        password: hashedPassword,
        role: 'user'
    };

    users.push(newUser);
    return res.status(201).json({ message: "Tạo user thành công!", user: newUser });
});

// Sửa
route.put('/users/:id', middleWare.requireToken, [
    body('name').optional().notEmpty().withMessage("Tên không hợp lệ"),
    body('email').optional().isEmail().withMessage("Email không hợp lệ"),
    body('role').optional().isIn(['admin', 'user']).withMessage("Vai trò không hợp lệ")
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, role } = req.body;

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: "User không tồn tại!" });
    }

    
    if (name) users[userIndex].name = name;
    if (email) {
        if (users.some(u => u.email === email && u.id !== id)) {
            return res.status(400).json({ message: "Email đã tồn tại!" });
        }
        users[userIndex].email = email;
    }
    if (role) users[userIndex].role = role;

    return res.status(200).json({ message: "Cập nhật thành công!", user: users[userIndex] });
});


// Xóa
route.delete('/users/:id', middleWare.requireToken, middleWare.requireAdmin, (req, res) => {
    const id = req.params.id; 

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ message: "User không tồn tại!" });
    }

    const deletedUser = users.splice(userIndex, 1)[0];

    return res.status(200).json({ message: "Xóa thành công!", user: deletedUser });
});

// Đăng nhập
route.post('/login', function (req, res) {
    const { userName, email, password } = req.body;

    if (!password || (!userName && !email)) {
        return res.status(400).json({ message: "Dữ liệu không hợp lệ!" });
    }

    const loginUser = users.find(u => u.userName === userName || u.email === email);

    if (!loginUser || !bcrypt.compareSync(password, loginUser.password)) {
        return res.status(400).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" });
    }

    const token = jwt.sign(
        { id: loginUser.id, userName: loginUser.userName, name: loginUser.name, role: loginUser.role },
        JWT_SECRET,
        { expiresIn: "10h" }
    );

    return res.status(200).json({ token });
});


module.exports = route;
