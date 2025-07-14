"use client";

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Select dates",
  className = ""
}: DateRangePickerProps) {
  console.log('DateRangePicker render:', { startDate, endDate });
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (date: Date | null) => {
    onStartDateChange(date);
    // If start date is after end date, clear end date
    if (date && endDate && date > endDate) {
      onEndDateChange(null);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    onEndDateChange(date);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return placeholder;
    if (startDate && !endDate) return `${startDate.toLocaleDateString()} - Select end date`;
    if (!startDate && endDate) return `Select start date - ${endDate.toLocaleDateString()}`;
    return `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`;
  };

  const clearDates = () => {
    onStartDateChange(null);
    onEndDateChange(null);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1">
        <div className="relative w-24 min-w-0">
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            minDate={startDate ? undefined : new Date()}
            placeholderText="Start"
            className="w-full px-4 py-3 border border-blue-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300"
            dateFormat="MM/dd/yy"
          />
        </div>
        <div className="relative w-24 min-w-0">
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={endDate ? undefined : (startDate || new Date())}
            placeholderText="End"
            className="w-full px-4 py-3 border border-blue-600 border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-blue-600 text-white placeholder-blue-300"
            dateFormat="MM/dd/yy"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={clearDates}
            className="p-1 text-blue-300 hover:text-white transition-colors flex-shrink-0"
            title="Clear dates"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
} 