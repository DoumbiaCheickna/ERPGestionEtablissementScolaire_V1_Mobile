import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface UserDevice {
  id: string;
  login: string;
  email: string;
  biometric_enabled: boolean;
  biometric_device_id: string;
  biometric_registered_at: string;
  role_id: string;
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserDevice[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDevice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'utilisateur ou email');
      return;
    }

    setLoading(true);
    try {
      // Search by login
      const loginQuery = query(
        collection(db, 'users'),
        where('login', '==', searchQuery.trim())
      );
      
      let querySnapshot = await getDocs(loginQuery);
      
      // If not found by login, try email
      if (querySnapshot.empty) {
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '==', searchQuery.trim())
        );
        querySnapshot = await getDocs(emailQuery);
      }

      const foundUsers: UserDevice[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        foundUsers.push({
          id: doc.id,
          login: data.login || '',
          email: data.email || '',
          biometric_enabled: data.biometric_enabled || false,
          biometric_device_id: data.biometric_device_id || '',
          biometric_registered_at: data.biometric_registered_at || '',
          role_id: data.role_id || '',
        });
      });

      if (foundUsers.length === 0) {
        Alert.alert('Aucun résultat', 'Aucun utilisateur trouvé avec ces critères');
      }

      setUsers(foundUsers);
    } catch (error) {
      console.log('Erreur recherche:', error);
      Alert.alert('Erreur', 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const resetUserDevice = async (user: UserDevice) => {
    Alert.alert(
      'Confirmer la réinitialisation',
      `Voulez-vous vraiment réinitialiser l'appareil de ${user.login}?\n\nCela permettra à l'utilisateur de s'enregistrer sur un nouvel appareil.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const userRef = doc(db, 'users', user.id);
              await updateDoc(userRef, {
                biometric_device_id: null,
                biometric_enabled: false,
                biometric_registered_at: null,
                device_reset_at: new Date().toISOString(),
                device_reset_by: 'admin', // You can pass admin ID here
              });

              Alert.alert(
                'Succès',
                `L'appareil de ${user.login} a été réinitialisé.\n\nL'utilisateur pourra s'enregistrer sur un nouvel appareil lors de sa prochaine connexion.`
              );

              // Refresh the search
              searchUsers();
            } catch (error) {
              console.log('Erreur réinitialisation:', error);
              Alert.alert('Erreur', 'Erreur lors de la réinitialisation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const disableBiometric = async (user: UserDevice) => {
    Alert.alert(
      'Désactiver la biométrie',
      `Voulez-vous désactiver l'authentification biométrique pour ${user.login}?\n\nL'utilisateur pourra se connecter avec son mot de passe uniquement.\n\nUtilisez cette option si:\n• Le Face ID/Touch ID est endommagé\n• L'utilisateur ne peut plus accéder à la biométrie\n• L'appareil ne supporte plus la biométrie`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Désactiver',
          onPress: async () => {
            setLoading(true);
            try {
              const userRef = doc(db, 'users', user.id);
              await updateDoc(userRef, {
                biometric_enabled: false,
                biometric_disabled_at: new Date().toISOString(),
                biometric_disabled_reason: 'Désactivé par admin',
              });

              Alert.alert('Succès', 'Biométrie désactivée avec succès.\n\nL\'utilisateur peut maintenant se connecter avec son mot de passe uniquement.');
              searchUsers();
            } catch (error) {
              console.log('Erreur désactivation:', error);
              Alert.alert('Erreur', 'Erreur lors de la désactivation');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const showUserDetails = (user: UserDevice) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion des Appareils</Text>
      <Text style={styles.subtitle}>
        Réinitialisez les appareils des utilisateurs qui changent de téléphone
      </Text>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Nom d'utilisateur ou email"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.buttonDisabled]}
          onPress={searchUsers}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>🔍 Rechercher</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      <ScrollView style={styles.resultsSection}>
        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📱</Text>
            <Text style={styles.emptyStateText}>
              Recherchez un utilisateur pour gérer ses appareils
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.login}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                {user.biometric_enabled && (
                  <View style={styles.enabledBadge}>
                    <Text style={styles.enabledBadgeText}>🔒 Activé</Text>
                  </View>
                )}
              </View>

              {user.biometric_enabled && (
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceLabel}>Appareil:</Text>
                  <Text style={styles.deviceId} numberOfLines={1}>
                    {user.biometric_device_id.substring(0, 20)}...
                  </Text>
                  <Text style={styles.deviceDate}>
                    Enregistré le {formatDate(user.biometric_registered_at)}
                  </Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => showUserDetails(user)}
                >
                  <Text style={styles.detailsButtonText}>📋 Détails</Text>
                </TouchableOpacity>

                {user.biometric_enabled && (
                  <>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => resetUserDevice(user)}
                    >
                      <Text style={styles.resetButtonText}>🔄 Réinitialiser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.disableButton}
                      onPress={() => disableBiometric(user)}
                    >
                      <Text style={styles.disableButtonText}>🔓 Désactiver</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Détails de l'utilisateur</Text>

            {selectedUser && (
              <View style={styles.detailsContainer}>
                <DetailRow label="Login" value={selectedUser.login} />
                <DetailRow label="Email" value={selectedUser.email} />
                <DetailRow
                  label="Biométrie"
                  value={selectedUser.biometric_enabled ? 'Activée' : 'Désactivée'}
                />
                {selectedUser.biometric_enabled && (
                  <>
                    <DetailRow
                      label="ID Appareil"
                      value={selectedUser.biometric_device_id}
                    />
                    <DetailRow
                      label="Enregistré le"
                      value={formatDate(selectedUser.biometric_registered_at)}
                    />
                  </>
                )}
                <DetailRow label="Rôle ID" value={selectedUser.role_id} />
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
    marginTop: 70,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  searchSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  resultsSection: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  enabledBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enabledBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  deviceInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  deviceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '600',
  },
  disableButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disableButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});