const router = require("express").Router();
const Event = require("../models/Event");
const Location = require("../models/Location");
/* const { isLoggedOut, isLoggedIn } = require("../middleware/route-guard"); */
const telegrambot = require("../telegram-notify");

// SHOWS THE EVENTS ON THE EVENTS PAGE

router.get(
  "/events",
  /* isLoggedIn, */ (req, res, next) => {
    Event.find()
      .populate("creator")
      .populate("location")
      .then((eventsFromDB) => {
        const preview = eventsFromDB.map((event) => event.date.toString());
        const day = preview.map((day) => day.slice(0, 15));
        const hour = preview.map((hour) => hour.slice(16, 21));
        let eventos = [];
        for (let i = 0; i < eventsFromDB.length; i++) {
          eventos.push({
            events: eventsFromDB[i],
            day: day[i],
            hour: hour[i],
          });
        }
        // console.log(eventos);
        res.render("events/index", {
          eventList: eventos,
        });
      })
      .catch((err) => next(err));
  }
);

router.post("/events", (req, res, next) => {
  Event.find()
    .populate("creator")
    .populate("location")
    .then((eventsFromDB) => {
      // console.log("contro: ", eventsFromDB);
      res.render("events/index", { eventList: eventsFromDB });
    })
    .catch((err) => next(err));
});

// ADD I : LISTS THE LOCATIONS TO SELECT
router.get("/events/new", (req, res, next) => {
  Location.find()
    .then((locationFromDb) => {
      res.render("events/new", { locationList: locationFromDb });
    })
    .catch((err) => {
      next(err);
    });
});

// // CREATES NEW EVENT
// router.get("/events/new", (req, res, next) => {
//   res.render("events/new");
// });

// ADD II : POSTS THE ENTRIES TO EVENTS PAGE

router.post("/events/new", (req, res, next) => {
  // console.log(req.session.currentUser);
  const userId = req.session.currentUser._id;
  console.log(userId);
  const { title, date, capacity, location } = req.body;
  Event.create({
    title: title,
    date: date,
    capacity: capacity,
    availableSlots: capacity,
    location: location,
    creator: userId,
  })
    .then((newEvent) => {
      //console.log(newEvent);
      telegrambot("A new beachvolley event is created! Check the website out!");
      res.redirect("/events");
    })
    .catch((err) => {
      res.redirect("/events");
    });
});

//GO TO JOIN PAGE

router.get("/events/:id", (req, res, next) => {
  const eventId = req.params.id;
  const userId = req.session.currentUser._id;
  console.log("userObject: ", userId);
  Event.findById(eventId)
    .populate("participants")
    .populate("location")
    .then((eventFromDb) => {
      console.log("eventFromDb: ", eventFromDb);
      let participants = eventFromDb.participants.map(
        (participant) => participant.id
      );
      if (!participants.includes(userId) && eventFromDb.availableSlots >= 1) {
        eventFromDb.participants.push(userId);
        eventFromDb.availableSlots = eventFromDb.availableSlots - 1;
        eventFromDb.save();
      }
      console.log("participants: ", participants);
      res.render("events/eventDetails", { event: eventFromDb });
    })
    .catch((err) => {
      next(err);
    });
});

// router.get("/events/eventDetails", (req, res, next) => {
//   const eventId = req.params.id;
//   const userId = req.session.currentUser._id;
//   console.log("userObject: ", userId);
//   Event.findById(eventId)
//     .populate("participants")
//     .populate('location')
//     .then((eventFromDb) => {
//       console.log('eventFromDb: ', eventFromDb);
//       let participants = eventFromDb.participants.map(participant => participant.id);
//       if (!participants.includes(userId) && eventFromDb.availableSlots >=1) {
//         eventFromDb.participants.push(userId);
//         eventFromDb.availableSlots = eventFromDb.availableSlots - 1;
//         eventFromDb.save();
//       }
//       console.log('participants: ',participants)
//       res.render("events/eventDetails", { event: eventFromDb});
//     })
//     .catch((err) => {
//       next(err);
//     });
// });

/* router.post('/events/:id', (req, res, next) => {
  const eventId = req.params.id;
  const userId = req.session.currentUser._id;
  Event.findByIdAndUpdate(eventId)
  .populate("participants")
  .then((eventFromDb) => {
    console.log(eventFromDb.participants)
    eventFromDb.participants.push(userId);
    eventFromDb.availableSlots = eventFromDb.availableSlots - 1;
    eventFromDb.save();
    res.render("events/eventDetails", { event: eventFromDb });
  })
  .catch((err) => {
    next(err);
  });
}) */

router.get("/events/:id/edit", (req, res, next) => {
  const eventId = req.params.id;
  const userId = req.session.currentUser._id;
  //console.log(req.params)

  Event.findById(eventId)
    .populate("participants")
    .then((eventFromDB) => {
      console.log(userId);
      console.log(eventFromDB.creator);

      if (eventFromDB.creator.toString() === userId) {
        Location.find().then((locationsFromDB) => {
          res.render("events/edit", {
            event: eventFromDB,
            locationList: locationsFromDB,
          });
        });
      } else {
        res.render("events/eventDetails", {
          message: "You are not the creator of this event",
        });
      }
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/events/:id/edit", (req, res, next) => {
  const eventId = req.params.id;
  console.log("try: ", req.body);
  const { title, date, capacity, location, participants, availableSlots } =
    req.body;
  Event.findByIdAndUpdate(eventId, {
    title,
    date,
    capacity,
    location,
    participants,
    availableSlots,
  })
    .then(() => {
      res.redirect("/events");
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/events/:id/delete", (req, res, next) => {
  const eventId = req.params.id;
  console.log("Funca!!", eventId);
  Event.findByIdAndRemove(eventId)
    .then((deletedEvent) => {
      res.redirect("/events");
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;