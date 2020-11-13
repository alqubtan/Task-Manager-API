const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Task = require("./Task");

const userScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    unique: true,
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    validate(email) {
      if (!validator.isEmail(email)) {
        throw new Error("Provide a vaild Email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(password) {
      if (validator.contains(password.toLowerCase(), "password")) {
        throw new Error("Password should not contains passwrod word");
      }
    },
  },
  age: {
    type: Number,
    required: true,
    validate(age) {
      if (age < 0) {
        throw new Error("Age must be vaild number");
      }
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar: Buffer
}, { // Scheme Options
  timestamps: true
});

userScheme.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// return user public profile

userScheme.methods.toJSON = function () {
  const user = this;
  // raw object for us wihtout mongoose
  const userData = user.toObject();
  delete userData.password;
  delete userData.tokens;
  delete userData.avatar
  
  return userData;
};

// generate token
userScheme.methods.generateToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "bazelalqubtan", {
    expiresIn: "30 d",
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// login vaildation
userScheme.statics.loginByCredentials = async (email, password) => {
  // check email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid account informations.");
  }
  // check password
  const correctPassword = await bcrypt.compare(password, user.password);
  if (!correctPassword) {
    throw new Error("Please check your password.");
  }
  return user;
};

// hashing password and saving it
userScheme.pre("save", async function (next) {
  const user = this;
  // hash password

  // 1- check if password has changed
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

userScheme.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userScheme);

module.exports = User;
