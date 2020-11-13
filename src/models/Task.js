const mongoose = require("mongoose");

const TaskScheme = new mongoose.Schema({
  description: {
    type: String,
    trim: true,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  
}, { // Scheme Options
  timestamps: true
});

const Task = mongoose.model("Task", TaskScheme);
module.exports = Task