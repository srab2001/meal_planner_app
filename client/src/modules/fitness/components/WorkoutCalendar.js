import React, { useState, useEffect } from 'react';
import '../styles/WorkoutTracking.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * WorkoutCalendar - Monthly calendar view of completed workouts
 * Route: /fitness/calendar
 */
export default function WorkoutCalendar({ onDaySelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchCalendarData();
  }, [year, month]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      const response = await fetch(`${API_URL}/api/workouts/calendar?month=${monthStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.ok) {
        setCalendarData(data.days);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  };

  const getWorkoutDataForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.find(d => d.date === dateStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const calendarDays = generateCalendarDays();

  return (
    <div className="workout-tracking-container">
      <div className="workout-tracking-header">
        <h1 className="workout-tracking-title">Workout Calendar</h1>
      </div>

      <div className="workout-calendar-container">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
            &#8249;
          </button>
          <h2 className="calendar-month-title">
            {monthNames[month]} {year}
          </h2>
          <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
            &#8250;
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner" />
        ) : (
          <div className="calendar-grid">
            {/* Day headers */}
            {dayNames.map((day, index) => (
              <div key={index} className="calendar-day-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((dayInfo, index) => {
              const workoutData = getWorkoutDataForDate(dayInfo.date);
              const hasWorkout = workoutData && workoutData.count > 0;

              return (
                <div
                  key={index}
                  className={`calendar-day ${!dayInfo.isCurrentMonth ? 'other-month' : ''} ${isToday(dayInfo.date) ? 'today' : ''} ${hasWorkout ? 'has-workout' : ''}`}
                  onClick={() => {
                    if (dayInfo.isCurrentMonth && hasWorkout) {
                      onDaySelect(dayInfo.date.toISOString().split('T')[0]);
                    }
                  }}
                  style={{ cursor: hasWorkout ? 'pointer' : 'default' }}
                >
                  <span className="calendar-day-number">{dayInfo.day}</span>
                  {hasWorkout && (
                    <>
                      <span className="calendar-workout-dot" />
                      {workoutData.count > 1 && (
                        <span className="calendar-workout-count">{workoutData.count}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
