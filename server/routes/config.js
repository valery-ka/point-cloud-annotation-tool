const express = require("express");
const classesConfig = require("../config/classes-config");
const objectsConfig = require("../config/objects-config");
const moderationConfig = require("../config/moderation-config");

const router = express.Router();

router.get("/classes", (req, res) => res.json(classesConfig));
router.get("/objects", (req, res) => res.json(objectsConfig));
router.get("/moderation", (req, res) => res.json(moderationConfig));

module.exports = router;
