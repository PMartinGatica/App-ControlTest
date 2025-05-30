import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

// Lista de correos electrónicos permitidos
const ALLOWED_EMAILS = [
  'adriana.venialgo@newsan.com.ar',
  'romina.morales@newsan.com.ar',
  'joaquin.acevedo@newsan.com.ar',
  'rocio.gamiz@newsan.com.ar',
  'lucia.castronuevo@newsan.com.ar',
  'azul.gon@newsan.com.ar',
  'guadalupe.cabana@newsan.com.ar',
  'paulacecilia.galvan@newsan.com.ar',
  'lucas.ruiz@newsan.com.ar',
  'maximiliano.vargas@newsan.com.ar',
  'ester.gago@newsan.com.ar',
  'brisa.caballero@newsan.com.ar',
  'daniel.maidana@newsan.com.ar',
  'mairaalejandra.morales@newsan.com.ar',
  'alisondenise.mendez@newsan.com.ar',
  'reneorlando.maldonado@newsan.com.ar',
  'bella.quinteros@newsan.com.ar',
  'maria.figueroa@newsan.com.ar',
  'mayra.tapia@newsan.com.ar',
  'mario.barrios@newsan.com.ar',
  'elias.esperguen@newsan.com.ar',
  'samuel.molina@newsan.com.ar',
  'facundomatias.tisera@newsan.com.ar',
  'ailin.chavarria@newsan.com.ar',
  'maria.requena@newsan.com.ar',
  'teresita.flores@newsan.com.ar',
  'fiorela.faydella@newsan.com.ar',
  'carlos.ramos@newsan.com.ar',
  'luismiguel.dimatteo@newsan.com.ar',
  'ruthevelin.gomez@newsan.com.ar',
  'sebastian.orellano@newsan.com.ar',
  'brian.moreyra@newsan.com.ar',
  'cristian.ramirez@newsan.com.ar',
  'pablomartin.gatica@newsan.com.ar'
];

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    // Verificar formato básico de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Verificar que el dominio sea newsan.com.ar
    const domain = email.split('@')[1];
    if (domain !== 'newsan.com.ar') {
      return false;
    }
    
    // Verificar si está en la lista de permitidos
    return ALLOWED_EMAILS.includes(email.toLowerCase());
  };

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingrese su correo electrónico');
      return;
    }
    
    setIsLoading(true);
    
    // Simulamos un pequeño retraso como en un login real
    setTimeout(async () => {
      if (validateEmail(email)) {
        const userName = email.split('@')[0]; // Extrae el nombre del correo
        onLogin(email, userName);
      } else {
        Alert.alert('Acceso denegado', 'No tiene autorización para acceder a esta aplicación');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png' }}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>Usar tu cuenta de Newsan</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Text>
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
    width: 150,
    height: 50,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6368',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a6c7ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Login;