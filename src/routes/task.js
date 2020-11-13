const express = require("express");
const Task = require('../models/Task')
const router = new express.Router();

// Create task endpoint
router.post("/tasks/create", async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get all tasks endpoint
//tasks?sortBy=createdAt:descend
router.get("/tasks", async (req, res) => {
  const match = {}
  const sort = {}
  if (req.query.completed) {
    match.completed = req.query.completed === 'true'
  }
  if (req.query.sortBy) {
    const value = req.query.sortBy.split(':') // ['createdAt', 'ascend']
    sort[value[0]] = value[1] === 'ascend' ? 1 : -1
  }
  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get single task endpoint
router.get("/tasks/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const task = await Task.findOne({_id, owner: req.user._id});
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (error) {
    res.status(500).send()
  }
});

// Update task information endpoint
router.patch("/tasks/:id", async (req, res) => {
  const updates = Object.keys(req.body)
  try {
    const task = await Task.findOne({_id:req.params.id, owner: req.user._id})
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach(update => task[update] = req.body[update])
    await task.save()
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Delete task endpoint

router.delete("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({owner: req.user._id, _id: req.params.id});
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});



module.exports = router