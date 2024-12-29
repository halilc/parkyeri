import React from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity } from 'react-native';
import { styles } from './styles';

interface ParkModalProps {
  visible: boolean;
  duration: string;
  onChangeDuration: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ParkModal: React.FC<ParkModalProps> = ({
  visible,
  duration,
  onChangeDuration,
  onClose,
  onSave,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Park Süresini Girin</Text>
          <TextInput
            style={styles.input}
            placeholder="Dakika (örn: 60)"
            keyboardType="numeric"
            value={duration}
            onChangeText={onChangeDuration}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={onSave}
            >
              <Text style={styles.modalButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}; 