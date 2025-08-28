import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');


export const styles = StyleSheet.create({
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
        width: 80,
        alignItems: 'flex-end',
    },
    markAllReadButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#e0f0ff',
    },
    deleteAll: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f3b6b6ff',
    },
    deleteAllText: {
        color: '#bd1d1dff',
        fontSize: 11,
        fontWeight: '600',
    },
    markAllReadText: {
        color: '#007bff',
        fontSize: 14,
        fontWeight: '600',
    },
    disabledText: {
        color: '#ccc',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
        flexGrow: 1,
    },
    // Swipe container
    swipeContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    // Delete background
    deleteBackground: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 100,
        backgroundColor: '#F44336',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    notificationItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    pressedNotification: {
        backgroundColor: '#f0f8ff',
        transform: [{ scale: 0.98 }],
    },
    longPressedNotification: {
        backgroundColor: '#e3f2fd',
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    notificationContent: {
        padding: 16,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007bff',
    },
    notificationTitle: {
        fontSize: Math.min(width * 0.045, 16),
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    notificationText: {
        fontSize: Math.min(width * 0.04, 14),
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: Math.min(width * 0.035, 12),
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'right',
    },
    noNotificationsContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    noNotificationsText: {
        marginTop: 16,
        fontSize: 16,
        color: "gray",
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "gray",
        textAlign: 'center',
    },
    // Options overlay styles
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
    },
    optionsContainer: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        maxWidth: 200,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 12,
    },
});