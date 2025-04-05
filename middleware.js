const jwt = require('jsonwebtoken');
const JWT_SECRET = "kbhhdsbgvfsjkbfvjkabslcfhakjscbábkjcbfabs";

module.exports = function () {
    function requireToken(req, res, next) {
        const authenHeader = req.headers['authorization'];

        if (!authenHeader) {
            return res.status(401).json({ message: "Error in authenHeader" });
        }

        const arr = authenHeader.split(' ');

        if (!arr || arr.length !== 2 || arr[0] !== 'Bearer') {
            return res.status(401).json({ message: "Error in arr" });
        }

        const token = arr[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthenticated" });
        }

        jwt.verify(token, JWT_SECRET, function (err, payload) {
            if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }
            req.user = payload;
            next();
        });
    }

    function requireAdmin(req, res, next) {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not admin!" });
        }
        next();
    }

    function requireSelfOrAdmin(req, res, next) {
        const userIdFromParams = parseInt(req.params.id, 10);  
        if (req.user.role !== 'admin' && req.user.id !== userIdFromParams) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }
        
        next();
    }
    

    return { requireToken, requireAdmin, requireSelfOrAdmin };
};
