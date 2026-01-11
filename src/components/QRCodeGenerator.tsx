// etudiant/components/QRCodeGenerator.tsx
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  userMatricule: string;
  courseId: string;
  courseLibelle: string
};

export default function QRCodeGenerator({ userMatricule }: Props) {
  const qrValue = `EMARGER:iibs_emargements:Etudiant:${userMatricule}`;

  return (
    <View style={[
      styles.container, 
      { alignItems: 'center', marginVertical: 20, maxWidth: '90%' }
      ]}
    >
      <QRCode 
        value={qrValue} 
        size={400}
        color="black"
        backgroundColor="white"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrInfo: {
    marginTop: 15,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 250,
  },
});