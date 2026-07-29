const { Router } = require("express");
const { platformController } = require("../controllers");

const router = Router();

router.get("/stats", platformController.stats);

module.exports = router;
