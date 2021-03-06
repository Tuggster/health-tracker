const express = require('express');
const app = express();

const Enmap = require("enmap");
const enmap = new Enmap({ name: "scores" });
const classes = new Enmap({ name: "classes" });
var fs = require("fs");
let info = require("info.js");
console.log(info.serverIP);

var bodyParser = require('body-parser')
app.use(bodyParser.json({ limit: '50mb' }));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var cors = require('cors');


app.use(express.json());       // to support JSON-encoded bodies
app.use(cors());
app.use(express.static('../health-tracker'))

Date.prototype.toUnixTime = function () { return this.getTime() / 1000 | 0 };
Date.time = function () { return new Date().toUnixTime(); }

const userProfile = {
  nameFirst: "John",
  nameLast: "Smith",
  username: "Tuggi",
  password: "hunter2",
  token: 403741957213496,
  id: 0,
  classes: Array()
};

const classTemplate = {
  name: "temp class",
  members: Array(),
  activities: Array(),
  approval_pool: Array(),
  history: Array(),
  settings: Array(),
  id: 3461247827
};

const classGoal = {
  goal_name: "Goal Template",
  goal_points: 1500
};

const classMember = {
  profile: userProfile,
  nickname: "HamyIsBoss",
  history: Array(),
  permissions: 0,
  teacher: false,
  score: 0
};

const activityTemplate = {
  name: "default_activity",
  details: "you shouldn't see this!",
  score: 0
}

const activitySubmissionTemplate = {
  author: "Tuggi",
  story: "I did a walking",
  date: new Date(),
  activity: null,
  approved: false
}


app.listen(8080, function () {
});

app.get(`/`, function (req, res) {
  res.send("You've reached pizza hut, how may I help you?");
})

app.get('/user', function (req, res) {
  if (req.query.do == "login") {
    if (enmap.get(req.query.username).password == req.query.password) {
      let sendUser = enmap.get(req.query.username);
      sendUser.password = undefined;
      res.send(sendUser);
    } else {
      res.sendStatus(403);
      console.log(enmap.get(req.query.username + " failed login!"));
    }
  } else if (req.query.do == "logintoken") {
    if (enmap.get(req.query.username).token == req.query.token) {
      let sendUser = enmap.get(req.query.username);
      sendUser.password = undefined;
      res.send(sendUser);
    } else {
      res.sendStatus(403);
      console.log(enmap.get(req.query.username + " failed login!"));
    }
  } else if (req.query.do == "getUserData") {
    let userClass = enmap.get(req.query.username);
    let user = userClass.members
    data.password = undefined;
    data.token = undefined;
    data.nameFirst = undefined;
    data.nameLast = undefined;
    data.classes = undefined;

    res.send(JSON.stringify(data));
  }
});

app.post('/user', function (req, res) {
  console.log("Recieved post to /user");

  if (req.body.do == "createUser") {
    if (req.body) {
      if (!enmap.get(req.body.username)) {
        let profile = userProfile;
        profile.id = enmap.size;
        profile.nameFirst = req.body.nameFirst;
        profile.nameLast = req.body.nameLast;
        profile.username = req.body.username;
        profile.password = req.body.password;
        profile.token = getRandomInt(999999999999999);

        enmap.set(profile.username, profile);
        res.sendStatus(201);
      } else {
        res.sendStatus(403);
      }
    }
  } else {
    res.sendStatus(404);
  }
})

app.post('/class', function (req, res) {
  if (req.body.do == "createClass") {
    if (req.body) {
      createClass(req.body.className, enmap.get(req.body.username));
      res.sendStatus(201);
      console.log("begun creating class.")
    }
  }

  if (req.body.do == "joinClass") {
    if (req.body.classID && req.body.username) {
      let user = enmap.get(req.body.username);
      let targetClass = classes.get(req.body.classID);

      if (!user || !targetClass)
        return;

      if (user.classes.includes(targetClass.id))
        return;

      user.classes.push(targetClass.id);
      /* Classmember template
        const classMember = {
          profile: userProfile,
          nickname: "HamyIsBoss",
          history: Array(),
          permissions: 0,
          teacher: false,
          score: 0
        };
      */
      let member = {};

      let temp = {
        username: user.username,
        nameFirst: user.nameFirst,
        nameLast: user.nameLast,
        id: user.id,
        classes: user.classes
      };

      member.profile = temp;
      member.nickname = user.username;
      member.history = Array();
      member.permissions = 0;
      member.teacher = false;
      member.score = 0;

      targetClass.members.push(member);

      enmap.set(user.username, user);
      classes.set(targetClass.id, targetClass);

      res.sendStatus(200);
    }
  }

  if (req.query.do == "removeActivity") {
    let currentClass = classes.get(req.query.classID);
    let act = currentClass.activities[req.query.activityID];

    console.log(act);
    console.log(currentClass.activities);

    if (act && currentClass) {
      currentClass.activities.splice(req.query.activityID, 1);
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }

    classes.set(req.query.classID, currentClass);
  }

  if (req.query.do == "addActivity") {
    let currentClass = classes.get(req.query.classID);

    if (currentClass) {
      let active = {
        title: req.body.title,
        details: req.body.details,
        value: req.body.value
      }

      currentClass.activities.push(active);
      classes.set(currentClass.id, currentClass);
      res.send(202);
    } else {
      res.send(402);
    }
  }

  if (req.query.do == "submitActivity") {
    let currentClass = classes.get(req.query.classID);
    console.log(`Submitting activity!
    name: ${req.body.author}`);
    if (req.body.activity) {
      /*
        const activitySubmissionTemplate = {
          author: "Tuggi",
          story: "I did a walking",
          date: new Date(),
          approved: false
        }
      */

      let act = {
        author: req.body.author,
        story: req.body.story,
        date: req.body.date,
        activity: req.body.activity,
        img: "none",
        approved: false
      }

      if (req.body.img != "none") {
        let fn = "ayy";
        if (req.body.img.startsWith(`data:image/png`)) {
          fn = `img/${req.body.author}${Date.time()}.png`;
          var base64Data = req.body.img.replace(/^data:image\/png;base64,/, "");
          act.img = `http://${info.serverIP}/${fn}`;

          require("fs").writeFile(fn, base64Data, 'base64', function (err) {
            console.log(err);
          });
        } else {
          fn = `img/${req.body.author}${Date.time()}.jpg`;

          var base64Data = req.body.img.replace(/^data:image\/jpeg;base64,/, "");
          act.img = `http://${info.serverIP}/${fn}`;

          require("fs").writeFile(fn, base64Data, 'base64', function (err) {
            console.log(err);
          });
        }
      }

      currentClass.approval_pool.push(act);
      classes.set(currentClass.id, currentClass);
      res.sendStatus(201);
    }
  }

  if (req.query.do == "modifyRequest") {
    let id = req.query.activityID;
    let currentClass = classes.get(req.query.classID);
    let approved = req.query.approved;
    let act = currentClass.approval_pool[id];
    let user = enmap.get(act.author);
    let classUserID;


    for (let i = 0; i < currentClass.members.length; i++) {
      let u = currentClass.members[i];

      if (u.profile.username == act.author) {
        user = u;
      }
    }

    if (approved == "true") {
      act.approved = true;
      user.score += Number(currentClass.approval_pool[id].activity.value);
      if (currentClass.settings[0]) {
        for (let i = 0; i < currentClass.settings[0].goals.length; i++) {
          let g = currentClass.settings[0].goals[i];

          g.goal_progress += Number(currentClass.approval_pool[id].activity.value);
        }
      }
    } else {
      act.approved = false;
    }

    user.history.push(act);
    currentClass.history.push(act);
    currentClass.members[classUserID] = user;
    currentClass.approval_pool.splice(id, 1);
    console.log(`Spliced ${id}!`)

    console.log(currentClass.activity_pool);

    classes.set(currentClass.id, currentClass);
    res.sendStatus(201);
  }

  if (req.query.do == "addGoal") {
    let cl = classes.get(req.query.classID);

    if (cl && req.body) {
      console.log(req.body);
      let goal = {
        goal_name: "",
        goal_points: 0,
        goal_progress: 0
      }

      goal.goal_name = req.body.name;
      goal.goal_points = req.body.points;
      goal.progress = 0;

      if (!cl.settings[0]) {
        cl.settings.push({
          goals: Array()
        });
      }

      cl.settings[0].goals.push(goal);
      console.log(cl.settings[0].goals)
      classes.set(Number(req.query.classID), cl);
      console.log(classes.get(req.query.classID));
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  }

  if (req.query.do == "setNickname") {
    let
  }

  if (req.query.do == "retractRequest") {
    let cl = classes.get(req.query.classId);
    let index = req.query.index;

    console.log(cl);
    if (cl != "undefined") {
      cl.approval_pool.splice(index, 1);
      console.log(cl.approval_pool[index]);
      classes.set(cl.id, cl);
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  }

  if (req.query.do == "editStory") {
    let cl = classes.get(req.query.classId);
    let index = req.query.index;
    let story = req.query.story;

    console.log(cl);
    if (cl != "undefined") {
      let newAct = cl.approval_pool[index];
      newAct.story = story;

      cl.approval_pool[index] = newAct;

      classes.set(cl.id, cl);
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  }
})

app.get('/class', function (req, res) {
  if (req.query.do == "getClasses" && req.query.username) {
    let user = enmap.get(req.query.username);
    if (!user) return;
    console.log("Ready to get classes.");
    let ret = {
      classes: Array(),
      user: ""
    }

    ret.user = req.query.username;
    for (let i = 0; i < user.classes.length; i++) {
      ret.classes.push(classes.get(String(user.classes[i])));
    }


    res.send(JSON.stringify(ret));
  }

  if (req.query.do == "getClass" && req.query.classID) {
    let targetClass = classes.get(req.query.classID);
    if (targetClass) {

      if (!targetClass.settings[0]) {
        targetClass.settings.push({
          goals: Array()
        })
      }

      res.send(JSON.stringify(targetClass));
      classes.set(req.query.classID, targetClass);
    }
  }
});



function createClass(className, creator) {
  let rand = getRandomInt(9999999999);
  let ready = false;
  while (!ready) {
    if (classes.get(rand) != undefined) {
      random = getRandomInt(9999999999);
      continue;
    } else {

      /* Teacher template --
        const classTeacher = {
          profile: userProfile,
          nickname: "HamyIsBoss",
          history: Array(),
          score: 0
        };
      */

      let classSend = classTemplate;
      classSend.name = className;
      classSend.id = rand;

      let teacher = classMember;
      Object.assign(classMember, teacher);

      let temp = {
        username: creator.username,
        nameFirst: creator.nameFirst,
        nameLast: creator.nameLast,
        id: creator.id,
        classes: creator.classes
      };

      teacher.profile = temp;
      teacher.teacher = true;
      teacher.nickname = creator.username;

      classSend.settings.push({
        goals: Array()
      });

      classSend.members = Array(teacher);

      creator.classes.push(rand);
      enmap.set(creator.username, creator);
      classes.set(rand, classSend);
      break;
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
