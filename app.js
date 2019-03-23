const express = require('express');
const app = express();

const Enmap = require("enmap");
const enmap = new Enmap({name: "scores"});
const classes = new Enmap({name: "classes"});

var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var cors = require('cors');


app.use(express.json());       // to support JSON-encoded bodies
app.use(cors());

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


app.listen(3000, function() {
  console.log(`Example app listening on port 3000!`);
});

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

app.post('/user', function(req, res) {
  console.log(req.body);

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
      console.log("begun.")
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

  if (req.query.do == "addActivity") {
    let currentClass = classes.get(req.query.classID);

    if (currentClass) {
      let active = {
        title: req.body.title,
        details: req.body.details,
        value: req.body.value
      }

      console.log(currentClass);
      currentClass.activities.push(active);
      console.log(currentClass);
      classes.set(currentClass.id, currentClass);
      res.send(202);
    } else {
      res.send(402);
    }
  }

  if (req.query.do == "submitActivity") {
    let currentClass = classes.get(req.query.classID);
    console.log(req.body);
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
        approved: false
      }

      currentClass.approval_pool.push(act);
      classes.set(currentClass.id, currentClass);
      res.sendStatus(201);
    }
  }
})

app.get('/class', function(req, res) {
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

    console.log(ret);
    res.send(JSON.stringify(ret));
  }

  if (req.query.do == "getClass" && req.query.classID) {
    let targetClass = classes.get(req.query.classID);
    if (targetClass) {
      res.send(JSON.stringify(targetClass));
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
        id: creator.id,
        classes: creator.classes
      };

      teacher.profile = temp;
      teacher.teacher = true;
      teacher.nickname = creator.username;

      classSend.members = Array(teacher);

      creator.classes.push(rand);
      enmap.set(creator.username, creator);
      classes.set(rand, classSend);
      console.log(classTemplate);
      break;
    }
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
