let express = require("express");
let app = express();

let rooms_id = 0;
let users_id = 0;

app.use(express.json());
app.get("/", (req, res) => {
    res.status(200).json({ message: "Hello World!" });
    }
);

function generateRandomToken() {
    return Math.random().toString(36).substr(2);
}

////////////
/// ROUTES
////////////

// get /rooms/:code
// get /users
// get /user/:id
// get /room/:id/subject/:user_id => get last subject user can see
// post /create-room
// post /join-room/:access_code
// put /pass-exercise/:user_id => pass to next exercise Request body: { token: string }
// TODO: delete /delete-room/:id => delete a room Request body: { token: string }

////////////
/// GET
////////////

/*
    ! GET /rooms/:code
    ? This route will be used to check if a access_code is already used or not
    If the access_code is already used => status 404
    If the access_code is not used => status 200
*/
app.get("/rooms/:code", (req, res) => {
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.access_code === req.params.code);
    if (room) {
        res.status(404).json({ message: "Room found!" });
    } else {
        res.status(202).json({ message: "Room not found!" });
    }
});

/*
    ! GET /users
    * Request body: {
    *   room_token: string
    * }
    ? This route will be used to get all users
    * Responde body: {
    *   nb_exercises: number,
    *   users: [
    *      {
    *         id: number,
    *         username: string,
    *         exercise: number
    *     }
    *  ]
    * }
*/
app.get("/users", (req, res) => {
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.token === req.body.room_token);
    if (room) {
        res.status(200).json({
            nb_exercises: room.nb_exercices,
            users: room.users
        });
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

/*
    ! GET /user/:id
    * Request body: {
    *   room_token: string
    * }
    ? This route will be used to get a user by id
    * Responde body: {
    *   id: number,
    *   username: string,
    *   exercise: number
    * }
*/
app.get("/user/:id", (req, res) => {
    let room_token = req.body.room_token;
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.token === room_token);
    if (room) {
        let user = room.users.find(user => user.id === req.params.id);
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: "User not found!" });
    }
});
    

/* 
    ! GET /room/:id/subject/:user_id
    * Request body: {
    *   token: string
    * }
    ? This route will be used to get the current subject of a user
    * Responde body: {
    *   subject: string
    * }
 */
app.get("/room/:token/subject/:user_id", (req, res) => {
    let room_id = req.params.id;
    let user_id = req.body.user_id;
    let token = req.body.token;
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.token === token);
    if (room) {
        let user = room.users.find(user => user.id === user_id);
        if (user) {
            let current_exercise = user.exercise;
            let subject = room.subjects[current_exercise];
            res.status(200).json({ subject: subject });
        }
        else { 
            res.status(404).json({ message: "User not found!" });
        }
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

////////////
/// POST
////////////

/*
    ! POST /create-room
    ? This route will be used to create a new room
    * Responde body: {
    *   token: string,
    *   id: number
    * }
*/
app.post("create-room", (req, res) => {
    let room_name = req.body.room_name;
    let this_room_id = rooms_id++;
    let nb_files = req.body.nb_files;
    let room_access_code = req.body.room_access_code;
    let files = [];
    for (let i = 0; i < nb_files; i++) {
        files.push(req.body["file" + i]);
    }
    let rooms = require("./rooms.json");
    let random_token = generateRandomToken();
    while (rooms.find(room => room.token === random_token)) {
        random_token = generateRandomToken();
    }
    rooms.push({
        id: this_room_id,
        token: random_token,
        access_code: room_access_code,
        name: room_name,
        users: [],
        nb_exercices: nb_files,
        subjects: files
    });
    fs.writeFileSync("./rooms.json", JSON.stringify(rooms));
    res.status(200).json({ token: random_token, id: this_room_id });
});

/*
    ! POST /join-room/:access_code
    * Request body: {
    *   username: string
    * }
    ? This route will be used to create a new room
    * Responde body: {
    *   room_token: string,
    *   room_id: number,
    *   user_id: number
    * }
*/
app.post("/join-room/:access_code", (req, res) => {
    if (!req.body.username) {
        res.status(400).json({ message: "Username is required!" });
    }
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.access_code === req.params.access_code);
    if (room) {
        let this_user_id = users_id++;
        room.users.push({
            id: this_user_id,
            username: req.body.username,
            exercise: 0
        });
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

////////////
/// PUT
////////////

/*
    ! PUT /pass-exercise/:user_id
    * Request body: {
    *   token: string
    * }
    * This route will be used to pass to the next exercise
    * Responde body: { message: string }    
*/
app.put("/pass-exercise/:user_id", (req, res) => {
    let room_token = req.body.token;
    let user_id = req.params.user_id;
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.token === room_token);
    if (room) {
        let user = room.users.find(user => user.id === user_id);
        if (user) {
            user.exercise++;
            fs.writeFileSync("./rooms.json", JSON.stringify(rooms)); // Save changes
            res.status(200).json({ message: "Exercise passed!" });
        } else {
            res.status(404).json({ message: "User not found!" });
        }
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});
        

////////////
/// DELETE
////////////

/*
    ! DELETE /delete-room/:id
    * Request body: {
    *   token: string
    * }
    * This route will be used to delete a room
    * Responde body: { message: string }   
*/
app.delete("/delete-room/:id", (req, res) => {
    let room_token = req.body.token;
    let rooms = require("./rooms.json");
    let room = rooms.find(room => room.token === room_token);
    if (room) {
        rooms.splice(rooms.indexOf(room), 1);
        fs.writeFileSync("./rooms.json", JSON.stringify(rooms)); // Save changes
        res.status(200).json({ message: "Room deleted!" });
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

module.exports = app;
