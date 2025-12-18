import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { getDoc, updateDoc } from 'firebase/firestore';
import useUserRef from '../components/hooks/getConnectedUser';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import Toast from '../components/layout/toast';
import { styles } from './styles'

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3; 

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export default function Notifications({navigation}: Props) {
    const { userRef, error } = useUserRef();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [loading, setLoading] = useState(true);
    const [longPressedNotification, setLongPressedNotification] = useState<string | null>(null);
    const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
    const [showOptions, setShowOptions] = useState(false);
    
    // Animation values
    const scaleAnim = useMemo(() => new Animated.Value(1), []);

    const getNotis = useCallback(async () => {
        if (!userRef) {
            setLoading(false);
            return;
        }

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                setNotifications([]);
                return;
            }

            const userData = userDoc.data();
            const userNotifications = userData.notifications || [];
            
            if (Array.isArray(userNotifications)) {
                setNotifications([...userNotifications].reverse());
            } else {
                setNotifications([]);
            }

        } catch (err) {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [userRef]);

    useEffect(() => {
        if (userRef) {
            getNotis();
        }
    }, [userRef, getNotis]);

    useEffect(() => {
        if (error) {
            setLoading(false);
            setNotifications([]);
        }
    }, [error]);

    const formatTime = useCallback((timestamp: any) => {
        if (!timestamp) return 'Il y a quelques instants';
        
        try {
            const now = new Date();
            const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const diffInMs = now.getTime() - notificationTime.getTime();
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInDays > 0) {
                return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
            } else if (diffInHours > 0) {
                return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
            } else {
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                if (diffInMinutes > 0) {
                    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
                }
                return 'Il y a quelques instants';
            }
        } catch (err) {
            return 'Il y a quelques instants';
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!userRef) return;

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            const userNotifications = userData.notifications || [];

            if (!Array.isArray(userNotifications)) return;

            const updatedNotifications = userNotifications.map(n => ({ ...n, read: true }));

            await updateDoc(userRef, {
                notifications: updatedNotifications,
            });

            setNotifications([...updatedNotifications].reverse());
            Alert.alert("Toutes les notifications marquées comme lues");

        } catch (err) {
            Alert.alert("Erreur lors de la mise à jour");
        }
    }, [userRef]);

    // Mark single notification as read
    const markSingleAsRead = useCallback(async (notificationId: string) => {
        if (!userRef || !notificationId) return;

        try {
            setShowOptions(false);
            setLongPressedNotification(null);

            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) return;

            const userData = userDoc.data();
            const userNotifications = userData.notifications || [];

            if (!Array.isArray(userNotifications)) return;

            const updatedNotifications = userNotifications.map(n => 
                (n.id || n.matiereId) === notificationId && !n.read ? { ...n, read: true } : n
            );

            await updateDoc(userRef, {
                notifications: updatedNotifications,
            });

            setNotifications([...updatedNotifications].reverse());
            Alert.alert("Notification marquée comme lue")

        } catch (err) {
            setToast({ message: "Erreur lors de la mise à jour", type: "error" });
        }
    }, [userRef]);

    // Delete notification via swipe
    const deleteNotification = useCallback(async (notificationId: string) => {
        if (!userRef || !notificationId) return;

        // Store original state for rollback
        const originalNotifications = [...notifications];

        try {
            // Optimistic update with CORRECT filter logic
            const optimisticNotifications = notifications.filter(n => {
                // Match by ID first, fallback to matiereId
                return n.id ? n.id !== notificationId : n.matiereId !== notificationId;
            });
            setNotifications(optimisticNotifications);

            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                setNotifications(originalNotifications); // Rollback
                return;
            }

            const userData = userDoc.data();
            const userNotifications = userData.notifications || [];

            if (!Array.isArray(userNotifications)) {
                setNotifications(originalNotifications); // Rollback
                return;
            }

            // Same CORRECT filter logic
            const updatedNotifications = userNotifications.filter(n => {
                return n.id ? n.id !== notificationId : n.matiereId !== notificationId;
            });

            await updateDoc(userRef, {
                notifications: updatedNotifications,
            });

            
            Alert.alert('Notification supprimée');

        } catch (err) {
            setNotifications(originalNotifications); // ✅ Rollback, don't refetch
            Alert.alert('Erreur lors de la suppression');
        }
    }, [userRef, notifications]);

    const deleteAllNotifications = useCallback(async () => {
        if (!userRef) return;

        const originalNotifications = [...notifications];

        try {
            setNotifications([]);

            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                setNotifications(originalNotifications); 
                return;
            }

            const userData = userDoc.data();
            const userNotifications = userData.notifications || [];

            if (!Array.isArray(userNotifications)) {
                setNotifications(originalNotifications); 
                return;
            }

            
            await updateDoc(userRef, {
            notifications: [],
            });

            Alert.alert("Toutes les notifications ont été supprimées");

        } catch (err) {
            // Rollback if failed
            setNotifications(originalNotifications);
            Alert.alert("Erreur lors de la suppression de toutes les notifications ❌");
        }
    }, [userRef, notifications]);


    const confirmDeleteAllNotifications = useCallback(() => {

        if(notifications.length == 0){
            Alert.alert("Pas de notifications à supprimer");
            return;
        }

        Alert.alert(
            "Confirmation",
            "Voulez-vous vraiment supprimer toutes les notifications ?",
            [
            {
                text: "Annuler",
                style: "cancel"
            },
            {
                text: "Supprimer",
                style: "destructive",
                onPress: deleteAllNotifications
            }
            ]
        );
        
    }, [deleteAllNotifications]);

    // Handle long press
    const handleLongPress = useCallback((notificationId: string, event: any) => {
        const { pageY } = event.nativeEvent;
        
        setLongPressedNotification(notificationId);
        setOptionsPosition({ 
            x: width / 2, 
            y: Math.min(pageY, height - 200)
        });
        setShowOptions(true);

        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

    }, [scaleAnim]);

    // Handle mark as read from options
    const handleMarkAsRead = useCallback(() => {
        if (!longPressedNotification) return;
        markSingleAsRead(longPressedNotification);
    }, [longPressedNotification, markSingleAsRead]);

    // Close options when tapping outside
    const handleOutsidePress = useCallback(() => {
        if (showOptions) {
            setShowOptions(false);
            setLongPressedNotification(null);
        }
    }, [showOptions]);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Create a separate component for swipeable items to avoid animation value recreation
    const SwipeableNotificationItem = React.memo(({ notification, index }: any) => {
        const notificationId = notification.id || notification.matiereId || `notif-${index}`;
        const isLongPressed = longPressedNotification == notificationId;
        
        // Use useMemo to prevent recreation of animation values
        const animationValues = useMemo(() => ({
            translateX: new Animated.Value(0),
            deleteOpacity: new Animated.Value(0)
        }), []);

        const { translateX, deleteOpacity } = animationValues;
        
        // Track if alert is already showing to prevent multiple alerts
        const alertShowing = React.useRef(false);

        const onGestureEvent = Animated.event(
            [{ nativeEvent: { translationX: translateX } }],
            { useNativeDriver: true }
        );

        const onHandlerStateChange = ({ nativeEvent }: any) => {
            if (nativeEvent.state === State.END) {
                if (Math.abs(nativeEvent.translationX) > SWIPE_THRESHOLD) {
                    // ✅ Only prevent if alert is currently visible, not just "was shown"
                    if (alertShowing.current) {
                        // Reset position and return
                        Animated.spring(translateX, {
                            toValue: 0,
                            useNativeDriver: true,
                        }).start();
                        return;
                    }
                    
                    alertShowing.current = true;
                    
                    Animated.timing(translateX, {
                        toValue: -width,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        Alert.alert(
                            'Confirmer la suppression',
                            'Voulez-vous vraiment supprimer cette notification ?',
                            [
                                { 
                                    text: 'Annuler', 
                                    style: 'cancel',
                                    onPress: () => {
                                        alertShowing.current = false;
                                        Animated.spring(translateX, {
                                            toValue: 0,
                                            useNativeDriver: true,
                                        }).start();
                                    }
                                },
                                { 
                                    text: 'Supprimer', 
                                    style: 'destructive',
                                    onPress: () => {
                                        alertShowing.current = false;
                                        deleteNotification(notificationId);
                                    }
                                }
                            ],
                            { 
                                cancelable: false,
                                // ✅ Always reset the flag when alert dismisses
                                onDismiss: () => {
                                    alertShowing.current = false;
                                }
                            }
                        );
                    });
                } else {
                    // Snap back to original position
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
                
                Animated.timing(deleteOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
    
            } else if (nativeEvent.state === State.ACTIVE) {
                // Show delete indicator when swiping
                const opacity = Math.min(Math.abs(nativeEvent.translationX) / SWIPE_THRESHOLD, 1);
                deleteOpacity.setValue(opacity);
            }
        };

        return (
            <View style={styles.swipeContainer}>
                {/* Delete background */}
                <Animated.View 
                    style={[
                        styles.deleteBackground,
                        { opacity: deleteOpacity }
                    ]}
                >
                    <Ionicons name="trash-outline" size={24} color="white" />
                    <Text style={styles.deleteText}>Supprimer</Text>
                </Animated.View>

                {/* Swipeable notification */}
                <PanGestureHandler
                    onGestureEvent={onGestureEvent}
                    onHandlerStateChange={onHandlerStateChange}
                    activeOffsetX={[-10, 10]}
                >
                    <Animated.View style={{ transform: [{ translateX }] }}>
                        <Pressable
                            onLongPress={(event) => handleLongPress(notificationId, event)}
                            delayLongPress={500}
                            style={({ pressed }) => [
                                styles.notificationItem,
                                pressed && styles.pressedNotification,
                                isLongPressed && styles.longPressedNotification
                            ]}
                        >
                            <Animated.View 
                                style={[
                                    styles.notificationContent,
                                    isLongPressed && { transform: [{ scale: scaleAnim }] }
                                ]}
                            >
                                <View style={styles.notificationHeader}>
                                    <Text style={styles.notificationTitle}>
                                        {notification.type || 'Notification'}
                                    </Text>
                                    {!notification.read && (
                                        <View style={styles.unreadDot} />
                                    )}
                                </View>
                                
                                <Text style={styles.notificationText}>
                                    {notification.message || 'Pas de message'}
                                </Text>

                                <Text style={styles.notificationTime}>
                                    {formatTime(notification.timestamp)}
                                </Text>
                            </Animated.View>
                        </Pressable>
                    </Animated.View>
                </PanGestureHandler>
            </View>
        );
    });

    // Render options overlay - only "Mark as read"
    const renderOptionsOverlay = useCallback(() => {
        if (!showOptions || !longPressedNotification) return null;

        const notification = notifications.find(n => 
            (n.id || n.matiereId) === longPressedNotification
        );

        return (
            <Pressable style={styles.overlay} onPress={handleOutsidePress}>
                <View 
                    style={[
                        styles.optionsContainer,
                        {
                            top: optionsPosition.y,
                            left: optionsPosition.x - 90,
                        }
                    ]}
                >
                    <TouchableOpacity 
                        style={styles.optionButton}
                        onPress={handleMarkAsRead}
                        disabled={notification?.read}
                    >
                        <Ionicons 
                            name={notification?.read ? "checkmark-circle" : "checkmark-circle-outline"} 
                            size={20} 
                            color={notification?.read ? "#ccc" : "#4CAF50"} 
                        />
                        <Text style={[
                            styles.optionText, 
                            { color: notification?.read ? "#ccc" : "#4CAF50" }
                        ]}>
                            {notification?.read ? "Déjà lu" : "Marquer comme lu"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        );
    }, [showOptions, longPressedNotification, notifications, optionsPosition, handleOutsidePress, handleMarkAsRead]);

    if (loading) {
        return (
            <GestureHandlerRootView style={styles.safeArea}>
                <SafeAreaView style={styles.safeArea}>
                    <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <View style={styles.headerRight} />
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#666" />
                        <Text style={styles.loadingText}>Chargement...</Text>
                    </View>
                </SafeAreaView>
            </GestureHandlerRootView>
        );
    }

    return (
        <GestureHandlerRootView style={styles.safeArea}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <TouchableOpacity 
                        style={styles.markAllReadButton} 
                        onPress={markAllAsRead}
                        disabled={notifications.length === 0 || notifications.every(n => n.read)}
                    >
                        <Text style={[
                            styles.markAllReadText,
                            (notifications.length === 0 || notifications.every(n => n.read)) && styles.disabledText
                        ]}>
                            Tout lire
                        </Text>

                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.deleteAll} 
                        onPress={confirmDeleteAllNotifications}
                    >
                        <Text style={[styles.deleteAllText]}>
                            Tout supprimer
                        </Text>
                        
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <SwipeableNotificationItem 
                                key={notification.id || notification.matiereId || `notif-${index}`}
                                notification={notification} 
                                index={index} 
                            />
                        ))
                    ) : (
                        <View style={styles.noNotificationsContainer}>
                            <MaterialCommunityIcons name="bell-off-outline" size={40} color="gray" />
                            <Text style={styles.noNotificationsText}>Pas de notifications</Text>
                        </View>
                    )}
                </ScrollView>
                
                {renderOptionsOverlay()}
                
                {toast && <Toast message={toast.message} type={toast.type} />}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

