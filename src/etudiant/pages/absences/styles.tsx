import { StyleSheet } from 'react-native';
import { theme } from '../../../styles/globalStyles';

export 
// Basic styles - you should adapt these to match your design system
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
    swipeContainer: {
        marginHorizontal: 16,
        marginVertical: 4,
        position: 'relative',
    },
    deleteBackground: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
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