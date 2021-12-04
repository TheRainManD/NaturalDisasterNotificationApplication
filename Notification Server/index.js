//express setup
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const { v4: uuidv4 } = require("uuid");
const cities = require("./cities.json");
const axios = require("axios").default;

//firebase setup
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const { response, json } = require("express");
const { firestore } = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

//google map api setup
const googleMapsClient = require("@google/maps").createClient({
  key: "*",
  Promise: Promise,
});

//topic list
const topicsList = [
  "Blizzard",
  "Earthquake",
  "Fire",
  "Flood",
  "Hurricane",
  "None",
  "Storm",
  "Tornado",
  "Tsunami",
  "Volcano",
];

//param checking
const verify = (params, res) => {
  for (const p of params) {
    if (p == null) {
      res.status(400).send("Missing parameters");
      return false;
    }
  }
  return true;
};

app.listen(port, () => {
  console.log(`Notification server listening at http://localhost:${port}`);
});

//test endpoint
app.get("/", (req, res) => {
  res.send("Server is up");
});

//register token
app.post("/token/:uid/:token", (req, res) => {
  if (req.params.uid && req.params.token) {
    const ref = db.collection("users").doc(req.params.uid);
    ref
      .get()
      .then((doc) => {
        if (doc.exists)
          ref.update({
            tokens: admin.firestore.FieldValue.arrayUnion(req.params.token),
          });
        else ref.set({ tokens: [req.params.token] });
      })
      .catch(() => {});
    res.send();
  } else res.status(400).send("Missing field");
});

//unregister token
app.delete("/token/:uid/:token", (req, res) => {
  if (req.params.uid) {
    const ref = db.collection("users").doc(req.params.uid);
    ref
      .get()
      .then((doc) => {
        if (doc.exists)
          ref.update({
            tokens: admin.firestore.FieldValue.arrayRemove(req.params.token),
          });
      })
      .catch(() => {});
    res.send();
  } else res.status(400).send("Missing field");
});

//get all topics
app.get("/topics", (req, res) => {
  res.json(topicsList);
});

//get subscription
app.get("/subscriptions/:uid", (req, res) => {
  if (req.params.uid) {
    db.collection("users")
      .doc(req.params.uid)
      .get()
      .then((doc) => {
        if (doc.exists && "topics" in doc.data()) res.json(doc.data().topics);
        else res.json([]);
      })
      .catch(() => res.status(500).send());
  } else res.status(400).send("Missing field");
});

//post subscription
app.post("/subscriptions/:uid", (req, res) => {
  if (req.params.uid && req.body.subscriptions) {
    const ref = db.collection("users").doc(req.params.uid);
    ref
      .get()
      .then((doc) => {
        if (doc.exists) ref.update({ topics: req.body.subscriptions });
        else ref.set({ topics: req.body.subscriptions });
      })
      .catch(() => {
        res.status(500).send();
      });
    res.send();
  } else res.status(400).send("Missing field or data payload");
});

app.delete("/locations/:uid", (req, res) => {
  const ref = db
    .collection("locations")
    .where("uid", "==", req.params.uid)
    .where("location", "==", req.body.location);
  ref.get().then((snapshot) => {
    snapshot.forEach((doc) => {
      doc.ref.delete();
    });
  });
  res.send();
});

//post notification
/*expected payload
{
  topic: "",
  message: "",
  locations: [],
  source: ""
}
*/
app.post("/notification", async (req, res) => {
  res.send();
  const NowTimestamp = admin.firestore.Timestamp.now();
  const notification = {
    title: req.body.topic + " alert!",
    message: req.body.message,
    timestamp: NowTimestamp,
    id: uuidv4(),
    source: req.body.source,
  };
  const subscriber = [];
  const followup = [];
  const tokens = [];

  console.log(
    "-------------------------------------------------------------------------------"
  );
  //convert locations to coordinate bounds
  /*
    san jose, ca
  */
  const lookup = new Set();
  const locations = {};
  for (const location of req.body.locations) {
    await googleMapsClient
      .geocode({ address: location })
      .asPromise()
      .then((response) => {
        const result = response.json.results[0];
        if (
          result != null &&
          !lookup.has(result.address_components[0].long_name)
        ) {
          result.address_components.forEach((component) => {
            lookup.add(component.long_name);
            if (component.long_name in locations) {
              delete locations[component.long_name];
            }
          });
          locations[result.address_components[0].long_name] =
            result.geometry.bounds;
        }
      });
  }
  console.log("location bounds:", locations);

  //save disaster incident
  var update = false;
  const news = {
    source: req.body.source,
    timestamp: NowTimestamp,
    message: req.body.message,
  };
  const overlaps = (source, lookup) => {
    for (const i of lookup) {
      if (i in source) return true;
    }
    return false;
  };
  var time = NowTimestamp.toDate();
  time.setDate(time.getDate() - 2);
  await db
    .collection("disasters")
    .where("type", "==", req.body.topic)
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(time))
    .get()
    .then(async (snapshot) => {
      const recordList = snapshot.docs.filter((doc) => {
        return overlaps(doc.get("bounds"), Object.keys(locations));
      });
      if (recordList.length > 0) {
        const disaster_id = recordList[0].id;
        notification["disaster"] = disaster_id;
        update = true;
        // console.log("disaster id", disaster_id);
        await db
          .collection("followup")
          .doc(disaster_id)
          .get()
          .then((doc) => {
            if (doc.exists) {
              doc.get("subscriber").forEach((user) => {
                followup.push(user);
              });
            }
          });
        const bounds = recordList[0].get("bounds");
        Object.keys(locations).forEach((l) => {
          if (!(l in bounds)) {
            bounds[l] = locations[l];
          }
        });
        recordList[0].ref.update({
          timestamp: NowTimestamp,
          message: admin.firestore.FieldValue.arrayUnion(news),
          bounds: bounds,
        });
      } else {
        await db
          .collection("disasters")
          .add({
            timestamp: NowTimestamp,
            message: [news],
            bounds: locations,
            type: req.body.topic,
            comment: [],
          })
          .then((doc) => {
            notification["disaster"] = doc.id;
            console.log("suceessfully created ", notification["disaster"]);
          });
      }
    });

  //create geofence object
  console.log("disaster id: ", notification["disaster"]);
  time = NowTimestamp.toDate();
  time.setDate(time.getDate() + 2);
  await Promise.all(
    Object.keys(locations).map(async (l) => {
      const coordinates = [
        [locations[l].northeast.lng, locations[l].northeast.lat],
        [locations[l].southwest.lng, locations[l].northeast.lat],
        [locations[l].southwest.lng, locations[l].southwest.lat],
        [locations[l].northeast.lng, locations[l].southwest.lat],
        [locations[l].northeast.lng, locations[l].northeast.lat],
      ];

      await axios
        .put(
          "https://api.radar.io/v1/geofences/" +
            notification["disaster"] +
            "/" +
            l.toLowerCase().replace(/ /g, ""),
          {
            description: req.body.topic + " in " + l,
            type: "polygon",
            coordinates: coordinates,
            deleteAfter: time.toISOString(),
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "*",
            },
          }
        )
        .then((r) => {
          // console.log(r.data);
        })
        .catch((error) => {
          console.log(error);
        });
    })
  );

  //fetch users in geofence if is update
  if (update) {
    console.log("follow up tweet");
    //fetch user in geofences
    const userInGeofences = [];
    await Promise.all(
      Object.keys(locations).map(async (l) => {
        await axios
          .get(
            "https://api.radar.io/v1/geofences/" +
              notification["disaster"] +
              "/" +
              l.toLowerCase().replace(/ /g, "") +
              "/users",
            {
              headers: {
                Authorization: "*",
              },
            }
          )
          .then((r) => {
            // console.log(r.data);
            const users = r.data.users;
            users.forEach((u) => {
              userInGeofences.push(u.userId);
            });
          })
          .catch((error) => {
            console.log(error);
          });
      })
    );
    await userInGeofences.map(async (user) => {
      await db
        .collection("users")
        .doc(user)
        .get()
        .then((doc) => {
          if (doc.exists && doc.get("geofence")) {
            doc.data().tokens.forEach((token) => {
              if (!tokens.includes(token)) tokens.push(token);
            });

            // save notification
            if ("notifications" in doc.data())
              doc.ref.update({
                notifications:
                  admin.firestore.FieldValue.arrayUnion(notification),
              });
            else
              doc.ref.update({
                notifications: [notification],
              });
          }
        })
        .catch((error) => console.log(error));
    });
    console.log("users in geofence", userInGeofences);
  }

  //filter based on bounds
  await Promise.all(
    Object.keys(locations).map(async (bound) => {
      const latSet = new Set();
      await db
        .collection("locations")
        .where("lat", ">=", locations[bound].southwest.lat)
        .where("lat", "<=", locations[bound].northeast.lat)
        .get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            latSet.add(doc.data().uid);
          });
        });
      await db
        .collection("locations")
        .where("lng", ">=", locations[bound].southwest.lng)
        .where("lng", "<=", locations[bound].northeast.lng)
        .get()
        .then((snapshot) => {
          snapshot.forEach((doc) => {
            if (
              latSet.has(doc.data().uid) &&
              !subscriber.includes(doc.data().uid)
            ) {
              subscriber.push(doc.data().uid);
            }
          });
        });
    })
  );
  console.log("filtered users", subscriber);
  console.log("follow up list", followup);

  //filter based on topic
  await Promise.all(
    subscriber.map(async (uid) => {
      await db
        .collection("users")
        .doc(uid)
        .get()
        .then((doc) => {
          if (doc.exists && doc.data().topics.includes(req.body.topic)) {
            doc.data().tokens.forEach((token) => {
              if (!tokens.includes(token)) tokens.push(token);
            });

            // save notification
            if ("notifications" in doc.data())
              doc.ref.update({
                notifications:
                  admin.firestore.FieldValue.arrayUnion(notification),
              });
            else
              doc.ref.update({
                notifications: [notification],
              });
          }
        });
    })
  );

  await Promise.all(
    followup.map(async (uid) => {
      await db
        .collection("users")
        .doc(uid)
        .get()
        .then((doc) => {
          if (doc.exists) {
            doc.data().tokens.forEach((token) => {
              if (!tokens.includes(token)) tokens.push(token);
            });
            if ("notifications" in doc.data())
              doc.ref.update({
                notifications:
                  admin.firestore.FieldValue.arrayUnion(notification),
              });
            else
              doc.ref.update({
                notifications: [notification],
              });
          }
        });
    })
  );

  console.log("filtered user tokens", tokens);

  if (tokens.length > 0) {
    //send notification
    const message = {
      tokens: tokens,
      notification: {
        title: req.body.topic + " alert!",
        body: req.body.message,
      },
      data: {
        source: req.body.source,
        timestamp: NowTimestamp.toDate().toString(),
      },
    };

    admin
      .messaging()
      .sendMulticast(message)
      .then(() => {
        console.log(
          "Successfully send notification to " + tokens.length + " devices"
        );
        console.log(
          "--------------------------------------------------------------------------"
        );
      });
  }
});

//get user notification
app.get("/notifications/:uid", (req, res) => {
  if (req.params.uid) {
    db.collection("users")
      .doc(req.params.uid)
      .get()
      .then((doc) => {
        if (doc.exists && "notifications" in doc.data()) {
          const notification = doc.data().notifications;
          notification.forEach((n) => {
            n.timestamp = n.timestamp.toDate();
          });
          res.send(notification);
        } else res.json([]);
      })
      .catch((error) => {
        console.error(error);
      });
  } else res.status(400).send("Missing fields");
});

//delete user notification
app.delete("/notifications/:uid/:nid", (req, res) => {
  if (req.params.uid && req.params.nid) {
    const ref = db.collection("users").doc(req.params.uid);
    ref
      .get()
      .then((doc) => {
        if (doc.exists && "notifications" in doc.data()) {
          const updated = doc
            .data()
            .notifications.filter(
              (notification) => notification.id != req.params.nid
            );
          ref.update({ notifications: updated });
        }
      })
      .catch((error) => {
        console.error(error);
      });
    res.send();
  } else res.status(400).send("Missing fields");
});

//get disasters within 48 hours
app.get("/disasters", (req, res) => {
  const time = admin.firestore.Timestamp.now().toDate();
  time.setDate(time.getDate() - 2);
  db.collection("disasters")
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(time))
    .get()
    .then((snapshot) => {
      const incidentGrouped = snapshot.docs.map((doc) => {
        const message = doc.get("message");
        message.forEach((message) => {
          message.timestamp = message.timestamp.toDate();
        });
        return {
          locations: Object.keys(doc.get("bounds")),
          timestamp: doc.get("timestamp").toDate(),
          type: doc.get("type"),
          message: message,
          id: doc.id,
        };
      });

      const locationGrouped = {};
      snapshot.docs.forEach((doc) => {
        const type = doc.get("type");
        const message = doc.get("message");
        const timestamp = doc.get("timestamp").toDate();
        const bounds = doc.get("bounds");
        const id = doc.id;
        message.forEach((m) => {
          m.timestamp = m.timestamp.toDate();
        });
        Object.keys(bounds).forEach((key) => {
          if (!(key in locationGrouped)) {
            const bound = bounds[key];
            locationGrouped[key] = { bound: bound };
            locationGrouped[key]["disasters"] = {};
          }
          locationGrouped[key]["disasters"][type] = {
            message: message,
            timestamp: timestamp,
            id: id,
          };
        });
      });

      res.send({ byLocation: locationGrouped, byIncident: incidentGrouped });
    });
});

//search query for city name
app.post("/locationsearch", (req, res) => {
  const query = req.body.query.toLowerCase().replace(/ /g, "");
  const candidates = Object.keys(cities)
    .filter((city) => city.includes(query))
    .map((city) => {
      return cities[city].name;
    });
  if (candidates.length > 5) res.send(candidates.slice(0, 14));
  else res.send(candidates);
});

//post user locations
app.post("/locations/:uid", (req, res) => {
  res.send();
  const locations = req.body.locations;
  const uid = req.params.uid;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      const subscribed = doc.get("locations");
      if (JSON.stringify(locations) != JSON.stringify(subscribed)) {
        db.collection("locations")
          .where("uid", "==", uid)
          .get()
          .then(async (snapshot) => {
            await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
            locations.forEach((city) => {
              const short = city.toLowerCase().replace(/ /g, "");
              if (short in cities) {
                db.collection("locations").add({
                  uid: req.params.uid,
                  location: city,
                  lat: Number(cities[short].lat),
                  lng: Number(cities[short].lng),
                });
              } else console.log("invalid city:", short);
            });
          });
        doc.ref.update({ locations: locations });
      } else console.log("No changes made");
    });
});

//get user locations
app.get("/locations/:uid", (req, res) => {
  const uid = req.params.uid;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      const locations = doc.get("locations");
      if (locations == null) res.send([]);
      else res.send(locations);
    });
});

//reverse geocoding
app.post("/reversegeo", (req, res) => {
  const coordinate = { lat: req.body.lat, lng: req.body.lng };
  googleMapsClient
    .reverseGeocode({ latlng: coordinate })
    .asPromise()
    .then((response) => {
      if (response.status == 200) {
        const address = response.json.results[0].address_components;
        const city = address.filter((component) =>
          component.types.includes("locality")
        );
        const state = address.filter((component) =>
          component.types.includes("administrative_area_level_1")
        );
        res.send(city[0].long_name + ", " + state[0].short_name);
      } else res.status(400).send();
    });
});

app.get("/disaster/:id", (req, res) => {
  const id = req.params.id;
  db.collection("disasters")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const disaster = doc.data();
        disaster.timestamp = disaster.timestamp.toDate();
        disaster.message.forEach((m) => {
          m.timestamp = m.timestamp.toDate();
        });
        disaster.comment.forEach((c) => {
          c.timestamp = c.timestamp.toDate();
        });
        res.send(disaster);
      } else res.status(400).send("not found");
    });
});

app.post("/comment", (req, res) => {
  const id = req.body.id;
  // const uid = req.body.uid;
  const email = req.body.email;
  const comment = req.body.comment;
  db.collection("disasters")
    .doc(id)
    .get()
    .then((doc) => {
      const original = doc.data().comment;
      const new_comment = {
        email: email,
        comment: comment,
        timestamp: admin.firestore.Timestamp.now(),
      };
      if (original == null) doc.ref.update({ comment: [new_comment] });
      else
        doc.ref.update({
          comment: admin.firestore.FieldValue.arrayUnion(new_comment),
        });
    });
});

app.post("/followup/:uid/:id", (req, res) => {
  res.send();
  const id = req.params.id;
  const uid = req.params.uid;
  db.collection("followup")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        doc.ref.update({
          subscriber: admin.firestore.FieldValue.arrayUnion(uid),
        });
      } else {
        doc.ref.set({ subscriber: [uid] });
      }
    });
});

app.delete("/followup/:uid/:id", (req, res) => {
  res.send();
  const id = req.params.id;
  const uid = req.params.uid;
  db.collection("followup")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        doc.ref.update({
          subscriber: admin.firestore.FieldValue.arrayRemove(uid),
        });
      }
    });
});

app.get("/followup/:uid/:id", (req, res) => {
  const id = req.params.id;
  const uid = req.params.uid;
  db.collection("followup")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists && doc.get("subscriber").includes(uid)) res.send();
      else res.status(404).send();
    });
});

//user geofence setting
app.put("/geofence/:uid", (req, res) => {
  res.send();
  const geofence = req.body.geofence;
  const uid = req.params.uid;
  db.collection("users").doc(uid).update({ geofence: geofence });
});

app.get("/geofence/:uid", (req, res) => {
  const uid = req.params.uid;
  db.collection("users")
    .doc(uid)
    .get()
    .then((doc) => {
      if (doc.exists && doc.get("geofence") != null) {
        const geofence = doc.get("geofence");
        res.json({ geofence: geofence });
      } else res.json({ geofence: false });
    });
});
