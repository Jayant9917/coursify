const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next){
    const token = req.headers.token;
    try {
        const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD);
        if(decoded){
            req.userId = decoded.id;
            next();
        } else{
            res.status(401).json({
                msg : "Invalid token"
            });
        }
    } catch (error) {
        res.status(401).json({
            msg : "Invalid token"
        });
    }
}

module.exports = {
    adminMiddleware
}