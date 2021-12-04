import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';

const baseUrl = 'https://wenhaotan-notification.herokuapp.com';

const sendTokenIfSignedIn = () => {
  const user = auth().currentUser;
  if (user) {
    messaging()
      .getToken()
      .then(token => {
        fetch(baseUrl + '/token/' + user.uid + '/' + token, {
          method: 'POST',
        });
      });
  }
};

const unregisterToken = () => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/token/' + user.uid, {
      method: 'DELETE',
    });
  }
};

const getAllLocationOptions = setState => {
  fetch(baseUrl + '/location')
    .then(response => response.json())
    .then(json => {
      setState(
        json.map(location => {
          return {label: location, value: location};
        }),
      );
    })
    .catch(error => {
      console.error(error);
    });
};

const getAllTopicOptions = setState => {
  fetch(baseUrl + '/topics')
    .then(response => response.json())
    .then(json => {
      setState(
        json.map(topic => {
          return {label: topic, value: topic};
        }),
      );
    })
    .catch(error => {
      console.error(error);
    });
};

const getUserLocations = setState => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/locations/' + user.uid)
      .then(response => response.json())
      .then(json => {
        setState(json);
      })
      .catch(error => {
        console.error(error);
      });
  }
};

const deleteLocation = (location, setLocation) => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/locations/' + user.uid, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({location: location}),
    }).then(() => {
      getUserLocations(setLocation);
    });
  }
};

const getUserSubscriptions = setState => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/subscriptions/' + user.uid)
      .then(response => response.json())
      .then(json => {
        setState(json);
      })
      .catch(error => {
        console.error(error);
      });
  }
};

const submitLocation = locations => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/locations/' + user.uid, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({locations: locations}),
    }).then(response => {
      if (!response.ok) {
        console.log('Failed to submit user locations');
      }
    });
  }
};

const submitSubscription = subscriptions => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/subscriptions/' + user.uid, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({subscriptions: subscriptions}),
    });
  }
};

const getUserNotifications = setState => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/notifications/' + user.uid)
      .then(response => response.json())
      .then(json => {
        json.reverse();
        setState(json);
      })
      .catch(error => {
        console.error(error);
      });
  }
};

const getUserNotificationsV2 = () => {
  const user = auth().currentUser;
  if (user) {
    return fetch(baseUrl + '/notifications/' + user.uid)
      .then(response => response.json())
      .catch(error => {
        console.error(error);
      });
  }
};

const deleteUserNotification = nid => {
  const user = auth().currentUser;
  if (user) {
    fetch(baseUrl + '/notifications/' + user.uid + '/' + nid, {
      method: 'DELETE',
    });
  }
};

const getDisasterLocations = setLocations => {
  fetch(baseUrl + '/disasters')
    .then(response => response.json())
    .then(json => {
      setLocations(json);
    });
};

const getAutoComplete = (query, setSuggestion) => {
  fetch(baseUrl + '/locationsearch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({query: query}),
  })
    .then(response => response.json())
    .then(json => setSuggestion(json));
};

const reverseGeo = (coordinate, setSuggestion, setLoading) => {
  fetch(baseUrl + '/reversegeo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({lat: coordinate.lat, lng: coordinate.lng}),
  })
    .then(response => response.text())
    .then(text => {
      setSuggestion([text]);
      setLoading(false);
    });
};

const getDisasters = () => {
  return fetch(baseUrl + '/disasters').then(response => response.json());
};

const getDisaster = id => {
  return fetch(baseUrl + '/disaster/' + id).then(response => response.json());
};

const postComment = (id, comment) => {
  const email = auth().currentUser.email;
  fetch(baseUrl + '/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      id: id,
      comment: comment,
    }),
  });
};

const getFollowup = id => {
  const uid = auth().currentUser.uid;
  return fetch(baseUrl + '/followup/' + uid + '/' + id);
};

const postFollowup = id => {
  const uid = auth().currentUser.uid;
  fetch(baseUrl + '/followup/' + uid + '/' + id, {
    method: 'POST',
  });
};

const deleteFollowup = id => {
  const uid = auth().currentUser.uid;
  fetch(baseUrl + '/followup/' + uid + '/' + id, {
    method: 'DELETE',
  });
};

const getGeofence = () => {
  const uid = auth().currentUser.uid;
  return fetch(baseUrl + '/geofence/' + uid, {
    method: 'GET',
  }).then(response => response.json());
};

const putGeofence = geofence => {
  const uid = auth().currentUser.uid;
  fetch(baseUrl + '/geofence/' + uid, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      geofence: geofence,
    }),
  });
};

export {
  sendTokenIfSignedIn,
  unregisterToken,
  submitLocation,
  getAllLocationOptions,
  getAllTopicOptions,
  getUserSubscriptions,
  getUserLocations,
  submitSubscription,
  getUserNotifications,
  deleteUserNotification,
  deleteLocation,
  getDisasterLocations,
  getAutoComplete,
  reverseGeo,
  getDisasters,
  getUserNotificationsV2,
  getDisaster,
  postComment,
  getFollowup,
  postFollowup,
  deleteFollowup,
  getGeofence,
  putGeofence,
};
