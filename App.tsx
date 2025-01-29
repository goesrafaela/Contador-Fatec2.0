import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';

interface HistoryItem {
  barcode: string;
  type: string;
}

export default function App() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>('Monitor');
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    Alert.alert('Código de barras escaneado', `Código: ${data}`);
    setHistory([...history, { barcode: data, type: selectedType }]);
  };

  const generatePDF = async () => {
    const htmlContent = `
      <html>
        <head><style>body { font-family: Arial, sans-serif; }</style></head>
        <body>
          <h1>Relatório de Patrimônios</h1>
          <ul>
            ${history.map(item => `<li>${item.type}: ${item.barcode}</li>`).join('')}
          </ul>
        </body>
      </html>
    `;
    
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    Alert.alert('PDF Gerado', `Local do arquivo: ${uri}`);
  };

  if (hasPermission === null) {
    return <Text>Solicitando permissão para acessar a câmera</Text>;
  }
  if (hasPermission === false) {
    return <Text>Sem acesso à câmera</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contador de Patrimônios</Text>
      <View style={styles.radioContainer}>
        {['Monitor', 'Gabinete', 'Estabilizador'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.radioButton, selectedType === type && styles.radioButtonSelected]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={styles.radioButtonText}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      {scanned && (
        <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Toque para escanear novamente</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={generatePDF}>
        <Text style={styles.buttonText}>Gerar PDF</Text>
      </TouchableOpacity>
      <FlatList
        data={history}
        renderItem={({ item }) => <Text>{item.type}: {item.barcode}</Text>}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    padding: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    marginTop: 25
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  radioButtonSelected: {
    backgroundColor: '#4682B4',
    borderColor: '#4682B4',
  },
  radioButtonText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
  },
  camera: {
    height: 200,
    width: '100%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
