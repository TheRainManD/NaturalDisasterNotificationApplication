import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TextInput, Button, HelperText} from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import {sendTokenIfSignedIn} from '../backend/backend';

const SignIn = ({navigation}) => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState('');

  const signIn = () => {
    if (email && password) {
      auth()
        .signInWithEmailAndPassword(email, password)
        .then(() => {
          console.log('login success');
          sendTokenIfSignedIn();
        })
        .catch(error => {
          if (error.code === 'auth/invalid-email') {
            setError('Invalid email address!');
          } else if (error.code === 'auth/user-not-found') {
            setError('Account not found!');
          } else if (error.code === 'auth/wrong-password') {
            setError('Incorrent password!');
          }
        });
    } else {
      setError("Email or password can't be empty!");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Email"
        style={styles.input}
        value={email}
        mode="outlined"
        error={error ? true : false}
        onChangeText={text => {
          setEmail(text);
          setError('');
        }}
      />
      <TextInput
        label="Password"
        style={styles.input}
        secureTextEntry={true}
        mode="outlined"
        value={password}
        error={error ? true : false}
        onChangeText={text => {
          setPassword(text);
          setError('');
        }}
      />
      <HelperText type="error" visible={error} style={styles.error}>
        {error}
      </HelperText>

      <Button mode="contained" style={styles.topButton} onPress={signIn}>
        Sign In
      </Button>
      <Button
        mode="text"
        uppercase={false}
        labelStyle={styles.textButton}
        onPress={() => navigation.navigate('signUp')}>
        Not a member? Sign up now!
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    marginHorizontal: 20,
    marginTop: 40,
  },
  input: {
    marginVertical: 10,
  },
  topButton: {
    marginTop: 30,
  },
  textButton: {
    fontSize: 12,
  },
  error: {
    alignSelf: 'center',
  },
  textButton: {
    fontSize: 12,
  },
});

export default SignIn;
