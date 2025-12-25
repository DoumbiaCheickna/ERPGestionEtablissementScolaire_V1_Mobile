import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveData } from '../utils/secureStorage';

interface PrivacyConsentScreenProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PrivacyConsentScreen({ 
  visible, 
  onAccept, 
  onDecline 
}: PrivacyConsentScreenProps) {
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  const acceptPrivacy = async () => {
    await saveData('privacy_accepted', 'true');
    await saveData('privacy_accepted_date', new Date().toISOString());
    onAccept();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Confidentialité et Données</Text>
            <Text style={styles.subtitle}>
              Votre vie privée est importante pour nous
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Localisation</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Utilisée uniquement pour vérifier votre présence sur le campus lors de l'émargement
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Jamais sauvegardée ni partagée avec des tiers
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Vérification locale uniquement (distance campus)
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Données Personnelles</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Nom, prénom, email (fournis par l'établissement)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Stockées de manière sécurisée et chiffrée
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Utilisées uniquement pour la gestion scolaire
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="fingerprint" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>Biométrie (Face ID/Empreinte)</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Optionnelle - vous pouvez refuser
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Reste sur votre appareil (jamais envoyée)
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.text}>
                Sécurise votre compte contre le partage
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="block" size={24} color="#e53e3e" />
              <Text style={styles.sectionTitle}>Ce que nous NE faisons PAS</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="close-circle" size={16} color="#e53e3e" />
              <Text style={styles.redText}>Vendre vos données</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="close-circle" size={16} color="#e53e3e" />
              <Text style={styles.redText}>Suivre votre localisation en continu</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="close-circle" size={16} color="#e53e3e" />
              <Text style={styles.redText}>Partager avec des annonceurs</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Ionicons name="close-circle" size={16} color="#e53e3e" />
              <Text style={styles.redText}>Utiliser vos données biométriques</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => setShowFullPolicy(true)}
          >
            <Ionicons name="document-text" size={20} color="#2196F3" />
            <Text style={styles.linkText}>Lire la politique complète</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={acceptPrivacy}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.acceptButtonText}>
                J'accepte et continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.declineButton}
              onPress={onDecline}
            >
              <Text style={styles.declineButtonText}>
                Je refuse (l'app ne peut pas fonctionner)
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            En continuant, vous acceptez notre politique de confidentialité
          </Text>
        </ScrollView>

        {/* Full Policy Modal */}
        <Modal visible={showFullPolicy} animationType="slide">
          <SafeAreaView style={styles.policyModal}>
            <View style={styles.policyHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setShowFullPolicy(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text style={styles.policyTitle}>Politique de Confidentialité</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.policyContent}>
              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <Ionicons name="document-text" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>1. COLLECTE DE DONNÉES</Text>
                </View>
                <Text style={styles.policyText}>
                  L'application IIBS collecte les données suivantes uniquement dans le cadre de la gestion scolaire :
                </Text>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Identité : nom, prénom, email fournis par l'établissement</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Localisation : vérification ponctuelle de présence sur campus (non stockée)</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Émargement : présences aux cours</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Biométrie (optionnel) : authentification locale sur appareil</Text>
                </View>
              </View>

              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <MaterialIcons name="settings" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>2. UTILISATION DES DONNÉES</Text>
                </View>
                <Text style={styles.policyText}>
                  Vos données sont utilisées exclusivement pour :
                </Text>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Gestion de votre compte étudiant/professeur</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Suivi des présences aux cours</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Communication avec l'établissement</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Sécurité du compte (biométrie optionnelle)</Text>
                </View>
              </View>

              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <Ionicons name="lock-closed" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>3. STOCKAGE ET SÉCURITÉ</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Données chiffrées sur votre appareil (SecureStore)</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Serveurs Firebase sécurisés pour les données scolaires</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Accès restreint au personnel autorisé uniquement</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Pas de partage avec des tiers</Text>
                </View>
              </View>

              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <MaterialIcons name="verified-user" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>4. VOS DROITS</Text>
                </View>
                <Text style={styles.policyText}>
                  Conformément au RGPD, vous avez le droit de :
                </Text>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Accéder à vos données</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Demander la correction de vos données</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Demander la suppression de votre compte</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="ellipse" size={8} color="#666" />
                  <Text style={styles.policyText}>Refuser la biométrie (authentification par mot de passe disponible)</Text>
                </View>
                <View style={styles.contactBox}>
                  <MaterialIcons name="email" size={16} color="#2196F3" />
                  <Text style={styles.contactText}>Contact : privacy@iibs.sn</Text>
                </View>
              </View>

              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <Ionicons name="location-sharp" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>5. LOCALISATION</Text>
                </View>
                <Text style={styles.policyText}>
                  La localisation est utilisée UNIQUEMENT au moment de l'émargement pour vérifier que vous êtes sur le campus. Elle n'est JAMAIS :
                </Text>
                <View style={styles.policyBullet}>
                  <Ionicons name="close-circle" size={12} color="#e53e3e" />
                  <Text style={styles.policyText}>Enregistrée dans une base de données</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="close-circle" size={12} color="#e53e3e" />
                  <Text style={styles.policyText}>Suivie en arrière-plan</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="close-circle" size={12} color="#e53e3e" />
                  <Text style={styles.policyText}>Partagée avec des tiers</Text>
                </View>
                <View style={styles.policyBullet}>
                  <Ionicons name="close-circle" size={12} color="#e53e3e" />
                  <Text style={styles.policyText}>Utilisée à d'autres fins</Text>
                </View>
              </View>

              <View style={styles.policySectionContainer}>
                <View style={styles.policySectionHeader}>
                  <MaterialIcons name="update" size={20} color="#2196F3" />
                  <Text style={styles.policySection}>6. MODIFICATIONS</Text>
                </View>
                <Text style={styles.policyText}>
                  Nous pouvons mettre à jour cette politique. Les changements importants vous seront notifiés dans l'application.
                </Text>
                <View style={styles.updateBox}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={styles.updateText}>Dernière mise à jour : Décembre 2024</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowFullPolicy(false)}
              >
                <Ionicons name="checkmark" size={24} color="white" />
                <Text style={styles.closeButtonText}>J'ai compris</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
    paddingLeft: 4,
  },
  text: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  redText: {
    fontSize: 14,
    color: '#e53e3e',
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  declineButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  // Full Policy Modal Styles
  policyModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyContent: {
    padding: 24,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  policySectionContainer: {
    marginBottom: 28,
  },
  policySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  policySection: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  policyText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  policyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingLeft: 8,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  updateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  updateText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 40,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});