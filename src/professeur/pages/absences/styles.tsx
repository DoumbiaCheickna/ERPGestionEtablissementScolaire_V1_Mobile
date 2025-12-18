import { Platform, StatusBar, StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    nonSwipeableAbsence: {
        opacity: 1,
        backgroundColor: '#ffffffff',     
     },
    swipeContainer: {
        position: 'relative',
        marginBottom: 12,
        margin: 20
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerRight: {
        width: 40,
    },
    deleteAll: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    deleteAllText: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: '500',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ff4757',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
        marginHorizontal: 16,
    },
    
    deleteText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    absenceItem: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    pressedAbsence: {
        opacity: 0.8,
    },
    longPressedAbsence: {
        backgroundColor: '#f5f5f5',
    },
    absenceContent: {
        gap: 8,
    },
    absenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    absenceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    absenceBadge: {
        backgroundColor: '#ff4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },

    absenceBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    absenceBadgeJustified: {
        alignItems: 'center',
        backgroundColor: '#006d09ff',
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRadius: 4,
        width: 120
    },
    absenceBadgeTextJustified: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    absenceBadgeWaiting: {
        alignItems: 'center',
        backgroundColor: 'dodgerblue',
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRadius: 4,
        width: 120
    },
    absenceBadgeTextWaiting: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },

     absenceBadgeRejected: {
        alignItems: 'center',
        backgroundColor: '#ff4444',
        paddingHorizontal: 2,
        paddingVertical: 2,
        borderRadius: 4,
        width: 120
    },

    absenceBadgeTextRejected: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
    },
    absenceTime: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    absenceDate: {
        fontSize: 14,
        color: '#666',
        textTransform: 'capitalize',
    },
    absenceTeacher: {
        fontSize: 12,
        color: '#888',
    },
    absenceRoom: {
        fontSize: 12,
        color: '#888',
    },
    absenceTimestamp: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 4,
    },
    noAbsencesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    noAbsencesText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
});