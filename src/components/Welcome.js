import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const Welcome = ({ userName, onContinue }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/Logo_Negro_1.png')}
        // O usa una URL: source={{uri: 'https://tuservidor.com/newsan-logo.png'}}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.welcomeText}>¡Bienvenido!</Text>
      <Text style={styles.nameText}>{userName}</Text>
      
      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Continuar a la aplicación</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nameText: {
    fontSize: 22,
    color: '#333',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  }
});

export default Welcome;