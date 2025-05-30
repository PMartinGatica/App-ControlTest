import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, KeyboardAvoidingView, 
         Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';

// Actualiza estas URLs con las que obtuviste de tus implementaciones
const SPECS_URL = 'https://script.google.com/macros/s/AKfycbx0feeplSe_FRg91TW_RCN0LTnj7gtF0WmuVdxQyXdRk8MAq5RVj-WxMrR_8TYaN9cK/exec';
const BBDD_URL = 'https://script.google.com/macros/s/AKfycbz7cpcKH2O6n_vf6693RNj2AU5uhj6lssp7owb-oCF1UB09QmSgP09o_7UND6hHnd6t/exec';

import Login from './src/components/Login';
import Welcome from './src/components/Welcome';

// Un componente personalizado para radio buttons
const RadioButton = ({ selected, onPress, label, style }) => {
  return (
    <TouchableOpacity 
      style={[styles.radioContainer, style]} 
      onPress={onPress}
    >
      <View style={[styles.radio, selected ? styles.radioSelected : {}]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// Componente de grupo de radio buttons
const RadioGroup = ({ options, selectedValue, onValueChange, containerStyle }) => {
  return (
    <View style={[styles.radioGroup, containerStyle]}>
      {options.map((option) => (
        <RadioButton
          key={option.value}
          selected={selectedValue === option.value}
          onPress={() => onValueChange(option.value)}
          label={option.label}
        />
      ))}
    </View>
  );
};

// Agregar después de los otros componentes
const RadioToggleGroup = ({ options, selectedValue, onValueChange, containerStyle }) => {
  return (
    <View style={[styles.toggleGroup, containerStyle]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.toggleButton,
            selectedValue === option.value && styles.toggleButtonSelected
          ]}
          onPress={() => onValueChange(option.value)}
        >
          <Text 
            style={[

              styles.toggleButtonText,
              selectedValue === option.value && styles.toggleButtonTextSelected
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Añadir después de las importaciones
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(Number(num))) {
    return '0';
  }
  return Number(num).toFixed(2);
};

export default function App() {
  const [linea, setLinea] = useState('');
  const [tipoControl, setTipoControl] = useState('');
  const [specs, setSpecs] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para spinner
  const [ciclos, setCiclos] = useState({}); // Para guardar ciclos por índice
  const [segundos, setSegundos] = useState({}); // Para guardar segundos por índice
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);
  const [isLoadingLineas, setIsLoadingLineas] = useState(false);
  
  // Nuevos estados para autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !showWelcome) {
      fetchLineas();
    }
  }, [isAuthenticated, showWelcome]);

  useEffect(() => {
    if (linea && tipoControl) fetchSpecs();
  }, [linea, tipoControl]);

  const fetchLineas = async () => {
    try {
      setIsLoadingLineas(true);
      const response = await fetch(SPECS_URL);
      const data = await response.json();
      const unicas = [...new Set(data.map(item => item.Linea).filter(l => l))];
      setLineasDisponibles(unicas);
    } catch (error) {
      Alert.alert('Error cargando líneas', error.message);
    } finally {
      setIsLoadingLineas(false);
    }
  };

  const fetchSpecs = async () => {
    try {
      setIsLoadingSpecs(true);
      const response = await fetch(SPECS_URL);
      const data = await response.json();
      const filtrado = data.filter(item => item.Linea === linea && item.Tipo === tipoControl);
      
      // Asegurar que cada spec tenga el valor de línea explícitamente asignado
      const specsConLinea = filtrado.map(spec => {
        return {...spec, lineaSeleccionada: linea};
      });
      
      setSpecs(specsConLinea);
      setRespuestas(specsConLinea.map(() => ''));
      // Inicializar ciclos y segundos
      const nuevoCiclos = {};
      const nuevoSegundos = {};
      specsConLinea.forEach((_, index) => {
        nuevoCiclos[index] = '';
        nuevoSegundos[index] = '';
      });
      setCiclos(nuevoCiclos);
      setSegundos(nuevoSegundos);
    } catch (error) {
      Alert.alert('Error cargando specs', error.message);
    } finally {
      setIsLoadingSpecs(false);
    }
  };

  const handleRespuesta = (index, value) => {
    const nuevas = [...respuestas];
    nuevas[index] = value;
    setRespuestas(nuevas);
  };

  const handleCiclos = (index, value) => {
    setCiclos({...ciclos, [index]: value});
  };

  const handleSegundos = (index, value) => {
    setSegundos({...segundos, [index]: value});
  };

  const validarDatos = () => {
    // Verificar si hay respuestas vacías
    const hayRespuestasVacias = specs.some((_, i) => !respuestas[i]);
    
    // Para prensas verificar ciclos y segundos donde corresponda
    if (tipoControl === 'Prensa') {
      const hayPuestosSinCiclos = specs.some((spec, i) => 
        spec.Ciclos && spec.Ciclos > 0 && !ciclos[i]);
        
      if (hayPuestosSinCiclos) {
        Alert.alert('Campos incompletos', 'Por favor complete los ciclos para todos los puestos necesarios');
        return false;
      }
    }
    
    if (hayRespuestasVacias) {
      Alert.alert('Campos incompletos', 'Por favor complete todos los valores');
      return false;
    }
    
    return true;
  };

  const enviar = async () => {
    // Validaciones previas sin cambios
    if (!validarDatos()) {
      return;
    }
    
    if (!linea) {
      Alert.alert('Campos incompletos', 'Por favor seleccione una línea');
      return;
    }
    
    let datos = [];
    
    // Generamos los datos según el tipo de control
    if (tipoControl === 'Prensa') {
      // Para prensas generamos dos registros por cada puesto (presión y segundos)
      specs.forEach((spec, i) => {
        const resultado = respuestas[i];
        const segundosValue = segundos[i] || '';
        const timestamp = Date.now();
        
        // 1. Registro para el resultado de presión
        if (resultado) {
          datos.push({
            ID: timestamp.toString() + '_p_' + i,
            Fecha: new Date().toLocaleString(),
            Usuario: userEmail, // Usar el email del usuario logueado
            TipoControl: tipoControl,
            Linea: linea.toString().trim(),
            Puesto: spec.Puesto,
            Fixture: spec.Fixture || '',
            Resultado: resultado,  // OK o NG para presión
            Min: spec.Min || '',
            Max: spec.Max || '',
          });
        }
        
        // 2. Registro para el tiempo en segundos (si se completó)
        if (segundosValue) {
          datos.push({
            ID: timestamp.toString() + '_s_' + i,
            Fecha: new Date().toLocaleString(),
            Usuario: userEmail, // Usar el email del usuario logueado
            TipoControl: tipoControl,
            Linea: linea.toString().trim(),
            Puesto: spec.Puesto,
            Fixture: `${spec.Fixture || ''}.Segundos`,  // Añadimos ".Segundos" al fixture
            Resultado: segundosValue,  // El valor numérico de segundos
            Min: spec.Min_Seg || '',   // Usamos Min_Seg para el tiempo
            Max: spec.Max_Seg || '',   // Usamos Max_Seg para el tiempo
          });
        }
      });
    } else {
      // Para otros tipos de control
      datos = specs.map((spec, i) => {
        const resultado = respuestas[i];
        return {
          ID: Date.now().toString() + i,
          Fecha: new Date().toLocaleString(),
          Usuario: userEmail, // Usar el email del usuario logueado
          TipoControl: tipoControl,
          Linea: linea.toString().trim(),
          Puesto: spec.Puesto,
          Fixture: spec.Fixture || '',
          Resultado: resultado,
          Min: spec.Min || '',
          Max: spec.Max || '',
        };
      }).filter(d => d.Resultado && d.Resultado !== '');
    }
    
    // Log para depuración
    console.log('Datos a enviar:', JSON.stringify(datos, null, 2));
    
    if (datos.length === 0) {
      Alert.alert('Error', 'No hay datos para enviar');
      return;
    }
    
    // El resto del código de envío se mantiene igual
    try {
      setIsLoading(true);
      
      const response = await fetch(BBDD_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: datos }),
      });
      
      // Obtener texto de respuesta antes de intentar convertir a JSON
      const responseText = await response.text();
      console.log('Respuesta cruda del servidor:', responseText.substring(0, 200));
      
      // Verificar si es HTML (comienza con <)
      if (responseText.trim().startsWith('<')) {
        throw new Error('El servidor devolvió HTML en lugar de JSON. Posible error en el script.');
      }
      
      // Ahora intentar parsear el JSON manualmente
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        throw new Error('Error al procesar la respuesta del servidor.');
      }
      
      console.log('Respuesta procesada:', result);
      
      setIsLoading(false);
      Alert.alert('✅ Datos enviados', 'Se enviaron ' + datos.length + ' registros');
      setSpecs([]);
      setRespuestas([]);
      setLinea('');
      setTipoControl('');
      setCiclos({});
      setSegundos({});
    } catch (error) {
      setIsLoading(false);
      Alert.alert('❌ Error al enviar', error.message);
      console.error('Error detallado:', error);
    }
  };

  // Función de inicio de sesión
  const handleLogin = (email, name) => {
    setUserEmail(email);
    setUserName(name);
    setShowWelcome(true);
    setIsAuthenticated(true);
    // Ya no guardamos en AsyncStorage
  };

  // Función para continuar después de la bienvenida
  const handleContinue = () => {
    setShowWelcome(false);
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
      setIsAuthenticated(false);
      setUserEmail('');
      setUserName('');
      setShowWelcome(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Renderizado condicional basado en el estado de autenticación
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (showWelcome) {
    return <Welcome userName={userName} onContinue={handleContinue} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.container}
            // Añadir esto para dar espacio extra al final
            contentInset={{ bottom: 60 }}
            contentInsetAdjustmentBehavior="automatic"
          >
            {/* Header con logo y opción de logout */}
            <View style={styles.header}>
              <Image 
                source={require('./assets/Logo_Negro_1.png')} 
                style={styles.headerLogo} 
                resizeMode="contain" 
              />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>

            {/* Título de la aplicación */}
            <Text style={styles.titulo}>Controles Diarios</Text>
            
            <Text style={styles.label}>Seleccionar Línea</Text>
            <View style={styles.pickerContainer}>
              {isLoadingLineas ? (
                <ActivityIndicator size="small" color="#1a73e8" style={{padding: 15}} />
              ) : (
                <Picker selectedValue={linea} onValueChange={setLinea}>
                  <Picker.Item label="Seleccionar..." value="" />
                  {lineasDisponibles.map((l, idx) => (
                    <Picker.Item label={l} value={l} key={idx} />
                  ))}
                </Picker>
              )}
            </View>

            <Text style={styles.label}>Tipo de Control</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={tipoControl} onValueChange={setTipoControl}>
                <Picker.Item label="Seleccionar..." value="" />
                <Picker.Item label="Torque" value="Torque" />
                <Picker.Item label="Pulsera" value="Pulsera" />
                <Picker.Item label="Prensa" value="Prensa" />
              </Picker>
            </View>

            {/* Mostrar spinner mientras carga specs */}
            {isLoadingSpecs && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>Cargando especificaciones...</Text>
              </View>
            )}

            {specs.map((item, index) => (
              <View key={index} style={styles.itemContainer}>
                <Text style={styles.puestoText}>{item.Puesto}</Text>
                {tipoControl === 'Prensa' && (
                  <Text>
                    {item.Punto || ''} {item.Punto && item.Fixture ? '/' : ''} {item.Fixture || ''}
                  </Text>
                )}
                {(item.Min && item.Max) && (
                  <Text style={styles.rangoText}>Rango permitido: {formatNumber(item.Min)} - {formatNumber(item.Max)}</Text>
                )}
                
                {/* Input para resultado dependiendo del tipo de control */}
                {tipoControl === 'Pulsera' ? (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Resultado:</Text>
                    <RadioToggleGroup
                      options={[
                        { label: 'OK', value: 'OK' },
                        { label: 'NG', value: 'NG' },
                        { label: 'TNG', value: 'TNG' }
                      ]}
                      selectedValue={respuestas[index]}
                      onValueChange={(value) => handleRespuesta(index, value)}
                    />
                  </View>
                ) : tipoControl === 'Prensa' ? (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Resultado de presión:</Text>
                    <RadioToggleGroup
                      options={[
                        { label: 'OK', value: 'OK' },
                        { label: 'NG', value: 'NG' }
                      ]}
                      selectedValue={respuestas[index]}
                      onValueChange={(value) => handleRespuesta(index, value)}
                    />
                  </View>
                ) : (
                  // Para Torque, usar slider
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>
                      Valor: {respuestas[index] ? Number(respuestas[index]).toFixed(2) : '0'}
                    </Text>
                    {item.Min && item.Max && (
                      <>
                        <Slider
                          style={styles.slider}
                          minimumValue={Number(item.Min) * 0.75}
                          maximumValue={Number(item.Max) * 1.25}
                          value={respuestas[index] ? Number(respuestas[index]) : Number(item.Min)}
                          onValueChange={(value) => handleRespuesta(index, value.toFixed(2))}
                          minimumTrackTintColor="#1a73e8"
                          maximumTrackTintColor="#000000"
                          step={0.01}
                        />
                        <View style={styles.sliderLabels}>
                          <Text>{(Number(item.Min) * 0.75).toFixed(2)}</Text>
                          <Text>{(Number(item.Max) * 1.25).toFixed(2)}</Text>
                        </View>
                      </>
                    )}
                  </View>
                )}
                
                {/* Para Prensas mostrar campos adicionales */}
                {tipoControl === 'Prensa' && (
                  <View style={styles.prensaContainer}>
                    {/* Punto/Fixture - CORREGIDO */}
                    <Text>
                      {item.Punto ? item.Punto : ''} {item.Punto && item.Fixture ? '/' : ''} {item.Fixture ? item.Fixture : ''}
                    </Text>
                    
                    {/* Campo de ciclos */}
                    {item.Ciclos && item.Ciclos > 0 && (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Ciclos (ref: {item.Ciclos})</Text>
                        <TextInput
                          placeholder="Ciclos"
                          keyboardType="numeric" 
                          value={ciclos[index]}
                          onChangeText={text => handleCiclos(index, text)}
                          style={styles.input}
                        />
                      </View>
                    )}
                    
                    {/* Campo de tiempo en segundos */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>
                        Tiempo en segundos: {segundos[index] ? Number(segundos[index]).toFixed(2) : '0'}s
                        {item.Min_Seg && item.Max_Seg && (
                          <Text style={styles.specText}> 
                            (Spec: {Number(item.Min_Seg).toFixed(2)}s - {Number(item.Max_Seg).toFixed(2)}s)
                          </Text>
                        )}
                      </Text>
                      {item.Min_Seg && item.Max_Seg ? (
                        <>
                          <Slider
                            style={styles.slider}
                            minimumValue={Number(item.Min_Seg) * 0.75}
                            maximumValue={Number(item.Max_Seg) * 1.25}
                            value={segundos[index] ? Number(segundos[index]) : Number(item.Min_Seg)}
                            onValueChange={(value) => handleSegundos(index, value.toFixed(1))}
                            minimumTrackTintColor="#1a73e8"
                            maximumTrackTintColor="#000000"
                            step={0.1}
                          />
                          <View style={styles.sliderLabels}>
                            <Text>{(Number(item.Min_Seg) * 0.75).toFixed(2)}s</Text>
                            <Text>{(Number(item.Max_Seg) * 1.25).toFixed(2)}s</Text>
                          </View>
                        </>
                      ) : (
                        <TextInput
                          placeholder="Segundos"
                          keyboardType="numeric" 
                          value={segundos[index]}
                          onChangeText={text => handleSegundos(index, text)}
                          style={styles.input}
                        />
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <Button 
                title="Enviar Datos"
                onPress={enviar}
                color="#1a73e8"
              />
            </View>

            {/* Spinner de carga */}
            {isLoading && (
              <ActivityIndicator size="large" color="#1a73e8" style={styles.spinner} />
            )}

            {/* Agrega un View vacío al final para dar espacio extra */}
            <View style={{ height: 60 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80, // Aumenta el padding inferior
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  logoutButton: {
    padding: 10,
  },
  logoutText: {
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  puestoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rangoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: {
    backgroundColor: '#1a73e8',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  spinner: {
    marginTop: 20,
  },
  prensaContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  toggleGroup: {
    flexDirection: 'row',
    marginVertical: 10,
    borderRadius: 4,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleButtonSelected: {
    backgroundColor: '#1a73e8',
    borderColor: '#1a73e8',
  },
  toggleButtonText: {
    fontWeight: '500',
    color: '#333',
  },
  toggleButtonTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#1a73e8',
    fontSize: 16,
  },
  specText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
