let express = require("express");
let app = express();

let rooms_id = 0;
let users_id = 0;
let rooms = [];

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

// get /room/:code
// get /users/:room_token
// get /user/:id/:room_token
// get /room/:id/:token/subject/:user_id => get last subject user can see
// post /room/create
// post /room/join/:access_code
// put /user/pass-exercise/:user_id => pass to next exercise Request body: { token: string }
// delete /room/:id => delete a room Request body: { token: string }

////////////
/// GET
////////////

app.get("/reset/:code", (req, res) => {
    let valid_code = "cGF0YXRl";
    let code = req.params.code;
    if (code === atob(valid_code)) {
        rooms = [];
        rooms_id = 0;
        users_id = 0;
        res.status(200).json({ message: "Rooms reseted!" });
    } else
        res.status(404).json({ message: "You have no rights!" }); 
});

app.get("/rooms", (req, res) => {
    res.status(200).json(rooms);
});

/*
    ! GET /room/:code
    ? This route will be used to check if a access_code is already used or not
*/
app.get("/room/:code", (req, res) => {
    
    let room = rooms.find(room => room.access_code === req.params.code);
    if (room) {
        res.status(404).json({ message: "Room found!" });
    } else {
        res.status(202).json({ message: "Room not found!" });
    }
});

/*
    ! GET /users/:room_token
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
app.get("/users/:room_token", (req, res) => {
    let room_token = req.params.room_token;
    
    let room = rooms.find(room => room.token === room_token);
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
    ! GET /user/:id/:room_token
    ? This route will be used to get a user by id
    * Responde body: {
    *   id: number,
    *   username: string,
    *   exercise: number
    * }
*/
app.get("/user/:id/:room_token", (req, res) => {
    let room_token = req.params.room_token;
    console.log(room_token);
    let room = null;
    for (let i = 0; i < rooms.length; i++) {
        console.log(rooms[i].token);
        if (rooms[i].token === room_token) {
            room = rooms[i];
            break;
        }
    }

    if (room) {
        let user = room.users.find(user => user.id === parseInt(req.params.id));
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: "User not found!" });
    }
});
    

/* 
    ! GET /room/:id/:token/subject/:user_id
    ? This route will be used to get the current subject of a user
    * Responde body: {
    *   subject: string
    * }
 */
app.get("/room/:token/subject/:user_id", (req, res) => {
    let room_id = req.params.id;
    let user_id = req.body.user_id;
    let token = req.params.token;
    
    let room = null;
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].token === token) {
            room = rooms[i];
            break;
        }
    }

    if (room) {
        let user = room.users.find(user => user.id === parseInt(user_id));
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
    ! POST /room/create
    ? This route will be used to create a new room
    * Responde body: {
    *   token: string,
    *   id: number
    * }
*/
app.post("/room/create", (req, res) => {
    let room_name = req.body.room_name;
    let this_room_id = rooms_id++;
    let nb_files = req.body.nb_files;
    let room_access_code = req.body.room_access_code;
    let files = [];
    console.log(req.body["files"    ]);
    for (let i = 0; i < nb_files; i++) {
        files.push(req.body["files"][i]);
    }
    
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
    // fs.writeFileSync("./rooms.json", JSON.stringify(rooms));
    res.status(200).json({ token: random_token, id: this_room_id });
});

/*
    ! POST /room/join/:access_code
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
app.post("/room/join/:access_code", (req, res) => {
    if (!req.body.username) {
        res.status(400).json({ message: "Username is required!" });
    }
    
    let room = rooms.find(room => room.access_code === req.params.access_code);
    if (room) {
        let this_user_id = users_id++;
        room.users.push({
            id: this_user_id,
            username: req.body.username,
            exercise: 0
        });
        // fs.writeFileSync("./rooms.json", JSON.stringify(rooms));
        res.status(200).json({
            room_token: room.token,
            room_id: room.id,
            user_id: this_user_id
        });
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

////////////
/// PUT
////////////

/*
    ! PUT /user/pass-exercise/:user_id
    * Request body: {
    *   token: string
    * }
    * This route will be used to pass to the next exercise
    * Responde body: { message: string }    
*/
app.put("/user/pass-exercise/:user_id", (req, res) => {
    let room_token = req.body.token;
    let user_id = req.params.user_id;
    let room = null;
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].token === room_token) {
            room = rooms[i];
            break;
        }
    }

    if (room) {
        let user = room.users.find(user => user.id === parseInt(user_id));
        if (user) {
            user.exercise++;
            if (user.exercise == room.nb_exercices) {
                res.status(400).json({ message: "No more exercises!" });
            }
            // fs.writeFileSync("./rooms.json", JSON.stringify(rooms)); // Save changes
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
    ! DELETE /room/:id
    * Request body: {
    *   token: string
    * }
    * This route will be used to delete a room
    * Responde body: { message: string }   
*/
app.delete("/room/:id", (req, res) => {
    let room_token = req.body.token;
    
    let room = null;
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].token === room_token) {
            room = rooms[i];
            break;
        }
    }
    
    if (room) {
        rooms.splice(rooms.indexOf(room), 1);
        // fs.writeFileSync("./rooms.json", JSON.stringify(rooms)); // Save changes
        res.status(200).json({ message: "Room deleted!" });
    } else {
        res.status(404).json({ message: "Room not found!" });
    }
});

module.exports = app;
