const express = require("express");
const User = require("../models/User");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require('sharp');

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
      return cb(new Error("File type not supported."), false);
    }
    cb(null, true);
  },
});

// Creata user endpoint
router.post("/users/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    // this will make token, save the user, return it
    const token = await user.generateToken();
    res.status(201).send({
      user,
      token,
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

// Login user endpoint

router.post("/users/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.loginByCredentials(email, password);
    const token = await user.generateToken();
    await res.send({ user: user.toJSON(), token });
  } catch (e) {
    res.status(400).send(e);
  }
});

// get user profile

router.get("/me", auth, async (req, res) => {
  res.send(req.user);
});

// Update user profile endpoint
router.patch("/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Logout user endpoint
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

// Logout all devices endpoint
router.post("/users/logout-all", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token === req.token
    );
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send(e);
  }
});

// Delete user profile
router.delete("/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

// upload avatar
router.post("/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().resize(200, 200).toBuffer()
    req.user.avatar = buffer
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// get avatar to use it as src for an image
router.get("/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set({'Content-Type': 'image/png'})
    res.send(user.avatar)
  } catch (error) {
    res.status(404).send()
  }
});

// delete avatar
router.delete("/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

module.exports = router;
