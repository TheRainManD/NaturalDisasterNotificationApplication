import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TextInput, Button, HelperText} from 'react-native-paper';
import auth from '@react-native-firebase/auth';

const SignUp = () => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [error, setError] = useState('');

  const signup = () => {
    if (email && password) {
      auth()
        .createUserWithEmailAndPassword(email, password)
        .then(() => {
          console.log('User account created & signed in!');
          sendTokenIfSignedIn();
        })
        .catch(error => {
          if (error.code === 'auth/email-already-in-use') {
            setError('Account already exists!');
          } else if (error.code === 'auth/invalid-email') {
            setError('Invalid email address!');
          } else if (error.code == 'auth/weak-password') {
            setError('Password is too weak!');
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
        mode="outlined"
        value={password}
        secureTextEntry={true}
        error={error ? true : false}
        onChangeText={text => {
          setPassword(text);
          setError('');
        }}
      />

      <HelperText type="error" visible={error} style={styles.error}>
        {error}
      </HelperText>

      <Button mode="contained" style={styles.topButton} onPress={signup}>
        Sign Up
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
});

export default SignUp;
