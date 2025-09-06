import React from 'react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { Clock, Users } from 'lucide-react';

interface LiveClass {
  live_class_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  meeting_platform: string;
  status: string;
  teacher_id: string;
  program_id: string;
  level_id: string;
  subject_id: string;
  teachers?: { 
    teacher_id: string; 
    users?: { 
      first_name: string; 
      last_name: string 
    } 
  };
  levels?: { name: string };
  subjects?: { name: string };
  programs?: { name: string };
}

interface LiveClassTimetableProps {
  liveClasses: LiveClass[];
  currentWeekStart: Date;
  timeSlots: string[];
}

export function LiveClassTimetable({ liveClasses, currentWeekStart, timeSlots }: LiveClassTimetableProps) {
  const getDayColumns = () => {
    return Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index));
  };

  const parseTimeToMinutes = (time: string | undefined | null): number | null => {
    if (!time) return null;
    const trimmed = String(time).trim().toUpperCase();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/);
    if (!match || !match[1] || !match[2]) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const suffix = match[4];
    if (suffix === 'PM' && hours < 12) hours += 12;
    if (suffix === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const getClassesForTimeSlot = (date: Date, timeSlot: string) => {
    const [slotHourStr, slotMinuteStr] = timeSlot.split(':');
    if (!slotHourStr || !slotMinuteStr) return [];
    const slotStart = parseInt(slotHourStr, 10) * 60 + parseInt(slotMinuteStr, 10);
    const slotEnd = slotStart + 60; // 1-hour slot

    return liveClasses.filter(liveClass => {
      const classDate = parseISO(liveClass.scheduled_date);
      if (!isSameDay(classDate, date)) return false;
      const start = parseTimeToMinutes(liveClass.start_time);
      const end = parseTimeToMinutes(liveClass.end_time) ?? (start !== null ? start + 60 : null);
      if (start === null || end === null) return false;
      // Show the class if it overlaps this slot in any way
      return start < slotEnd && end > slotStart;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 border-blue-100';
      case 'ongoing': return 'bg-green-50 border-green-100';
      case 'completed': return 'bg-gray-50 border-gray-100';
      case 'cancelled': return 'bg-red-50 border-red-100';
      default: return 'bg-gray-50 border-gray-100';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-700';
      case 'ongoing': return 'text-green-700';
      case 'completed': return 'text-gray-700';
      case 'cancelled': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              Time
            </th>
            {getDayColumns().map(date => (
              <th
                key={date.toISOString()}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {format(date, 'EEE dd MMM')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {timeSlot}
              </td>
              {getDayColumns().map(date => {
                const classes = getClassesForTimeSlot(date, timeSlot);
                return (
                  <td key={date.toISOString()} className="px-6 py-4">
                    {classes.map(liveClass => (
                      <div
                        key={liveClass.live_class_id}
                        className={`mb-2 p-2 rounded border ${getStatusColor(liveClass.status)}`}
                      >
                        <div className={`font-medium ${getStatusTextColor(liveClass.status)}`}>
                          {liveClass.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {liveClass.start_time} - {liveClass.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {liveClass.teachers?.users?.first_name} {liveClass.teachers?.users?.last_name}
                          </div>
                          <div>{liveClass.subjects?.name}</div>
                          <div className="text-xs mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                              {liveClass.levels?.name}
                            </span>
                            {liveClass.programs?.name && (
                              <span className="ml-1 bg-gray-100 px-2 py-0.5 rounded">
                                {liveClass.programs.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
