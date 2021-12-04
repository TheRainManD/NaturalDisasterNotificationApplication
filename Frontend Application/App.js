import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  LogBox,
  View,
  Text,
  PermissionsAndroid,
  PermissionStatus,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import SignIn from './components/SignIn';
import {ActivityIndicator, Colors} from 'react-native-paper';
import {createStackNavigator} from '@react-navigation/stack';
import SignUp from './components/SignUp';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';
import Setting from './components/Setting';
import messaging from '@react-native-firebase/messaging';
import {getUserNotifications, sendTokenIfSignedIn} from './backend/backend';
import PushNotification from 'react-native-push-notification';
import Notification from './components/Notification';
import NearByDisasters from './components/NearByDisasters';
import {NavigationContainer} from '@react-navigation/native';
import Disaster from './components/Disaster';
import Radar from 'react-native-radar';

LogBox.ignoreLogs(['Reanimated 2', 'Warning: ...']);
LogBox.ignoreAllLogs();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const App = () => {
  const [user, setUser] = useState();
  const [initializing, setInitializing] = useState(true);
  const {colors} = useTheme();

  // Radar.on('clientLocation', result => {
  //   // do something with result.location
  //   console.log('clientLocation', result);
  // });

  // Radar.on('location', result => {
  //   // do something with result.location, result.user
  //   // console.log('location', result);
  // });

  // Radar.on('error', err => {
  //   // do something with err
  //   // console.log('error', result);
  // });

  const SignInScreen = ({navigation}) => {
    return <SignIn navigation={navigation} />;
  };

  const SignUpScreen = navigation => {
    return <SignUp />;
  };

  const notificationTab = ({navigation}) => {
    return <Notification navigation={navigation} />;
  };

  const settingTab = ({navigation}) => {
    return <Setting navigation={navigation} />;
  };

  const nearbyTab = ({navigation}) => {
    return <NearByDisasters navigation={navigation} />;
  };

  useEffect(() => {
    let mounted = true;
    const onAuthStateChanged = async new_user => {
      setUser(new_user);
      if (new_user) {
        // console.log(new_user.uid);
        Radar.setUserId(new_user.uid);
        Radar.startTrackingContinuous();
        // console.log('started tracking');
      }
      if (initializing) setInitializing(false);
    };
    const authSubscriber = auth().onAuthStateChanged(onAuthStateChanged);
    if (mounted && user) {
      console.log(user.uid);
      Radar.setUserId(user.uid);
      Radar.startTrackingContinuous();
      console.log('radar user set and start tracking');
    }
    const tokenSubscriber = messaging().onTokenRefresh(sendTokenIfSignedIn);

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      PushNotification.localNotification({
        /* Android Only Properties */
        channelId: 'cmpe295', // (required) channelId, if the channel doesn't exist, notification will not trigger.
        /* iOS and Android properties */
        title: remoteMessage.notification.title, // (optional)
        message: remoteMessage.notification.body, // (required)
      });
    });
    return () => {
      mounted = false;
      // unsubscribe on unmount
      authSubscriber();
      tokenSubscriber();
      unsubscribe();
    };
  }, []);

  const tab = () => {
    return (
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;
            if (route.name === 'Notification') {
              iconName = focused ? 'bell' : 'bell-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'account' : 'account-outline';
            } else if (route.name === 'Nearby') {
              iconName = focused ? 'map-marker' : 'map-marker-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: colors.primary,
          inactiveTintColor: 'gray',
        }}>
        <Tab.Screen name="Nearby" component={NearByDisasters} />
        <Tab.Screen name="Notification" component={notificationTab} />
        <Tab.Screen name="Profile" component={settingTab} />
      </Tab.Navigator>
    );
  };

  const disaster = () => {
    return <Disaster />;
  };

  if (initializing)
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          animating={true}
          color={Colors.red800}
          size="large"
        />
      </SafeAreaView>
    );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Navigator initialRouteName="signIn">
          <Stack.Screen
            name="signIn"
            component={SignInScreen}
            options={{
              title: 'Sign In',
            }}
          />
          <Stack.Screen
            name="signUp"
            component={SignUpScreen}
            options={{title: 'Sign Up'}}
          />
        </Stack.Navigator>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Navigator initialRouteName="tab">
        <Stack.Screen
          name="tab"
          component={tab}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="disaster"
          component={Disaster}
          options={{
            title: 'Incident Details',
            headerTitleStyle: {
              fontSize: 16,
              color: 'rgba(0,0,0,0.8)',
            },
          }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    // backgroundColor: 'white',
  },
});

export default App;
