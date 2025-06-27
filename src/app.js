const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
require('dotenv').config();
const Project = require('./models/UploadProject');
require('./db/conn');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);  // Bind socket.io to the same server
const PORT = process.env.PORT || 4000;

const staticPath = path.join(__dirname, "../public");
app.use(express.static(staticPath));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Serve the HTML form
app.get("/", (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
});

// Route to handle form submission
app.post("/submitForm", (req, res) => {
    const { name, start_date, end_date, email, phone_number, address, city, region, department, uploadPath, imageInput, datetime, description } = req.body;

    if (!name || !start_date || !end_date || !email || !phone_number || !address || !city || !region || !department || !description) {
        return res.status(400).send('All fields are required.');
    }

    const newProject = new Project({
        name,
        start_date,
        end_date,
        email,
        phone_number,
        address,
        city,
        region,
        file_upload: uploadPath || null,
        image_upload: imageInput || null,
        department,
        description,
        datetime
    });

    newProject.save()
        .then(() => res.sendFile(
            path.join(staticPath, "../public/Departement/Project.html")
        ))
        .catch(err => res.status(400).send('Error: ' + err.message));
});

io.on("connection", (socket) => {
    socket.on("userMessage", (message) => {
        io.emit("message", message);
    });
});

app.get("/projects", async (req, res) => {
    try {
        const projects = await Project.find({});
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

app.get("/projects/:id", async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch project details" });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
