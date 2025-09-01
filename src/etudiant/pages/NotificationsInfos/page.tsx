import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, updateDoc } from 'firebase/firestore';
import useUserRef from '../../components/hooks/getConnectedUser';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import Toast from '../../../layout/toast';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationsInfos'>;

interface NotificationSettings {
  messages: boolean;
  events: boolean;
  announcements: boolean;
}

export default function NotificationsInfos({navigation}: Props) {
    const { userRef, error } = useUserRef();
    const [settings, setSettings] = useState<NotificationSettings>({
        messages: true,
        events: true,
        announcements: true
    });
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);

    // Load notification settings from Firestore
    const loadSettings = useCallback(async () => {
        if (!userRef) {
            setLoading(false);
            return;
        }

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                setLoading(false);
                return;
            }

            const userData = userDoc.data();
            const notificationSettings = userData.notificationSettings || {
                messages: true,
                events: true,
                announcements: true
            };
            
            setSettings(notificationSettings);
        } catch (err) {
            setToast({ message: "Erreur lors du chargement", type: "error" });
        } finally {
            setLoading(false);
        }
    }, [userRef]);

    // Save settings to Firestore
    const saveSettings = useCallback(async (newSettings: NotificationSettings) => {
        if (!userRef) return;

        try {
            await updateDoc(userRef, {
                notificationSettings: newSettings
            });

            setToast({ message: "Paramètres sauvegardés", type: "success" });
        } catch (err) {
            setToast({ message: "Erreur lors de la sauvegarde", type: "error" });
        }
    }, [userRef]);

    // Handle toggle switch
    const handleToggle = useCallback(async (key: keyof NotificationSettings) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };
        
        setSettings(newSettings);
        await saveSettings(newSettings);
    }, [settings, saveSettings]);

    useEffect(() => {
        if (userRef) {
            loadSettings();
        }
    }, [userRef, loadSettings]);

    useEffect(() => {
        if (error) {
            setLoading(false);
        }
    }, [error]);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const renderSettingItem = useCallback((
        key: keyof NotificationSettings,
        title: string,
        description: string
    ) => (
        <View key={key} style={styles.settingItem}>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>
            <Switch
                value={settings[key]}
                onValueChange={() => handleToggle(key)}
                trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                thumbColor={Platform.OS === 'ios' ? undefined : settings[key] ? '#34C759' : '#f4f3f4'}
                ios_backgroundColor="#E5E5EA"
                style={styles.switch}
            />
        </View>
    ), [settings, handleToggle]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
            
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>General</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Notifications</Text>
                
                <View style={styles.settingsContainer}>
                    {renderSettingItem(
                        'messages',
                        'Messages',
                        'Receive notifications for new messages'
                    )}
                    
                    {renderSettingItem(
                        'events',
                        'Events',
                        'Receive notifications for new events'
                    )}
                    
                    {renderSettingItem(
                        'announcements',
                        'Announcements',
                        'Receive notifications for new announcements'
                    )}
                </View>
            </ScrollView>
            
            {toast && <Toast message={toast.message} type={toast.type} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: 'white',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        paddingBottom: 100,
        flexGrow: 1,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginTop: 32,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    settingsContainer: {
        paddingHorizontal: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingContent: {
        flex: 1,
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 17,
        fontWeight: '400',
        color: '#000',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 15,
        color: '#8E8E93',
        lineHeight: 20,
    },
    switch: {
        transform: Platform.OS === 'ios' ? [] : [{ scaleX: 1.2 }, { scaleY: 1.2 }],
    },
});