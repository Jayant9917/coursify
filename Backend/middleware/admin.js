const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next){
    const token = req.headers.token;
    const decoded = jwt.verify(token, JWT_ADMIN_PASSWORD);

    if(decoded){
        req.userId = decoded.indexOf;
        next();
    } else{
        res.status(400).json({
            mssg : "you are signed in"
        })
    }
}

module.exports = {
    adminMiddleware
}