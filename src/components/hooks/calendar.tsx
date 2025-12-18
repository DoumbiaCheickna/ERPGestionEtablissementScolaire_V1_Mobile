import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../styles/globalStyles';

interface CalendarProps {
  onDateSelect: (date: Date, dayName: string) => void;
  selectedDate?: Date;
}

const CustomCalendar = ({ onDateSelect, selectedDate }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateState, setSelectedDateState] = useState<Date | null>(selectedDate || null);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    
    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const startOffset = firstDay.getDay();
    
    // Calculate start date (beginning of calendar grid)
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);

    const days = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks × 7 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDatePress = (date: Date) => {
    // Only allow selection of dates from current month and weekdays (Monday to Saturday)
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 6; // Monday to Saturday
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
    
    if (isWeekday && isCurrentMonth) {
      setSelectedDateState(date);
      const dayName = dayNames[date.getDay()];
      onDateSelect(date, dayName);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() == today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDateState && date.toDateString() == selectedDateState.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() == currentDate.getMonth();
  };


  // Update selected date when prop changes
  useEffect(() => {
    setSelectedDateState(selectedDate || null);
  }, [selectedDate]);

  const days = getDaysInMonth(currentDate);

  return (
    <View style={styles.calendarContainer}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthYearText}>
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysOfWeekContainer}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayOfWeekCell}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCell,
                !isCurrentMonthDate && styles.otherMonthDate,
                isTodayDate && styles.todayDate,
                isSelectedDate && styles.selectedDate,
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text style={[
                styles.dateText,
                !isCurrentMonthDate && styles.otherMonthDateText,
                isTodayDate && styles.todayDateText,
                isSelectedDate && styles.selectedDateText,
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.todayDot]} />
          <Text style={styles.legendText}>Aujourd'hui</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.selectedDot]} />
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.weekendDot]} />
          <Text style={styles.legendText}>Weekend</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border || '#e0e0e0',
  },

  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text || '#000',
  },

  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text || '#000',
  },

  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },

  dayOfWeekText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dateCell: {
      width: '13%', 
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      margin: 0, 
      marginTop: 20,
      marginHorizontal: 2, 
    },

  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text || '#000',
  },

  otherMonthDate: {
    opacity: 0.3,
  },

  otherMonthDateText: {
    color: theme.colors.textSecondary,
  },

  weekendDate: {
    backgroundColor: theme.colors.background,
  },

  weekendDateText: {
    color: theme.colors.textSecondary,
  },

  todayDate: {
    backgroundColor: '#2196F3',
  },

  todayDateText: {
    color: '#fff',
    fontWeight: '600',
  },

  selectedDate: {
    backgroundColor: 'rgb(1, 1, 34)',
  },

  selectedDateText: {
    color: '#fff',
    fontWeight: '600',
  },

  disabledDate: {
    opacity: 0.5,
  },

  disabledDateText: {
    color: theme.colors.textSecondary,
  },

  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#e0e0e0',
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  todayDot: {
    backgroundColor: theme.colors.primary,
  },

  selectedDot: {
    backgroundColor: '#000',
  },

  weekendDot: {
    backgroundColor: theme.colors.textSecondary,
  },

  legendText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});

export default CustomCalendar;