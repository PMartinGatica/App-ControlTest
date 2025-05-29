import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, KeyboardAvoidingView, 
         Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Actualiza estas URLs con las que obtuviste de tus implementaciones
const SPECS_URL = 'https://script.google.com/macros/s/AKfycbx0feeplSe_FRg91TW_RCN0LTnj7gtF0WmuVdxQyXdRk8MAq5RVj-WxMrR_8TYaN9cK/exec';
const BBDD_URL = 'https://script.google.com/macros/s/AKfycbz7cpcKH2O6n_vf6693RNj2AU5uhj6lssp7owb-oCF1UB09QmSgP09o_7UND6hHnd6t/exec';

export default function App() {
  const [linea, setLinea] = useState('');
  const [tipoControl, setTipoControl] = useState('');
  const [specs, setSpecs] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [usuario] = useState('usuario@newsan.com.ar');
  const [lineasDisponibles, setLineasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para spinner
  const [ciclos, setCiclos] = useState({}); // Para guardar ciclos por índice
  const [segundos, setSegundos] = useState({}); // Para guardar segundos por índice

  useEffect(() => {
    fetchLineas();
  }, []);

  useEffect(() => {
    if (linea && tipoControl) fetchSpecs();
  }, [linea, tipoControl]);

  const fetchLineas = async () => {
    try {
      const response = await fetch(SPECS_URL);
      const data = await response.json();
      const unicas = [...new Set(data.map(item => item.Linea).filter(l => l))];
      setLineasDisponibles(unicas);
    } catch (error) {
      Alert.alert('Error cargando líneas', error.message);
    }
  };

  const fetchSpecs = async () => {
    try {
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
            Usuario: usuario,
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
            Usuario: usuario,
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
          Usuario: usuario,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Título de la aplicación */}
          <Text style={styles.titulo}>Controles Diarios</Text>
          
          <Text style={styles.label}>Seleccionar Línea</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={linea} onValueChange={setLinea}>
              <Picker.Item label="Seleccionar..." value="" />
              {lineasDisponibles.map((l, idx) => (
                <Picker.Item label={l} value={l} key={idx} />
              ))}
            </Picker>
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

          {specs.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <Text style={styles.puestoText}>{item.Puesto}</Text>
              {tipoControl === 'Prensa' && <Text>{item.Punto || ''} / {item.Fixture || ''}</Text>}
              {(item.Min && item.Max) && (
                <Text style={styles.rangoText}>Rango permitido: {item.Min} - {item.Max}</Text>
              )}
              
              {/* Input para resultado dependiendo del tipo de control */}
              {tipoControl === 'Pulsera' ? (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={respuestas[index]}
                    onValueChange={(value) => handleRespuesta(index, value)}
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="OK" value="OK" />
                    <Picker.Item label="NG" value="NG" />
                    <Picker.Item label="TNG" value="TNG" />
                  </Picker>
                </View>
              ) : tipoControl === 'Prensa' ? (
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Resultado de presión</Text>
                  <Picker
                    selectedValue={respuestas[index]}
                    onValueChange={(value) => handleRespuesta(index, value)}
                  >
                    <Picker.Item label="Seleccionar..." value="" />
                    <Picker.Item label="OK" value="OK" />
                    <Picker.Item label="NG" value="NG" />
                  </Picker>
                </View>
              ) : (
                <TextInput
                  placeholder="Valor"
                  keyboardType="numeric"
                  value={respuestas[index]}
                  onChangeText={text => handleRespuesta(index, text)}
                  style={styles.input}
                />
              )}
              
              {/* Para Prensas mostrar campos adicionales */}
              {tipoControl === 'Prensa' && (
                <View style={styles.prensaContainer}>
                  {/* Campo de ciclos (si corresponde) */}
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
                      Tiempo en segundos {item.Min_Seg && item.Max_Seg ? 
                      `(Spec: ${item.Min_Seg} - ${item.Max_Seg})` : ''}
                    </Text>
                    <TextInput
                      placeholder="Segundos"
                      keyboardType="numeric" 
                      value={segundos[index]}
                      onChangeText={text => handleSegundos(index, text)}
                      style={styles.input}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          {specs.length > 0 && (
            <View style={styles.btnContainer}>
              <Button 
                title={isLoading ? "ENVIANDO..." : "ENVIAR"} 
                onPress={enviar} 
                disabled={isLoading}
              />
              {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />}
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60, // Aumentado para evitar chocar con notificaciones
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
  },
  puestoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rangoText: {
    fontStyle: 'italic',
    marginBottom: 10,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  btnContainer: {
    marginVertical: 20,
  },
  spinner: {
    marginTop: 20,
  },
  prensaContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  inputGroup: {
    marginBottom: 10,
  }
});
