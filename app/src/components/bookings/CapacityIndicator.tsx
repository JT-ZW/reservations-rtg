import React from 'react';

interface CapacityIndicatorProps {
  attendees: number;
  roomCapacity: number;
  roomName?: string;
}

export default function CapacityIndicator({ attendees, roomCapacity, roomName }: CapacityIndicatorProps) {
  if (!roomCapacity || attendees <= 0) {
    return null;
  }

  const percentage = Math.min((attendees / roomCapacity) * 100, 100);
  const isOverCapacity = attendees > roomCapacity;
  const isNearCapacity = percentage >= 90 && percentage <= 100;

  let barColor = 'bg-green-500';
  let bgColor = 'bg-green-100';
  let textColor = 'text-green-700';
  let statusText = 'Good capacity';

  if (isOverCapacity) {
    barColor = 'bg-red-500';
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    statusText = 'Over capacity';
  } else if (isNearCapacity) {
    barColor = 'bg-amber-500';
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    statusText = 'Near capacity';
  }

  return (
    <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Room Capacity {roomName && `(${roomName})`}
        </span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {attendees} / {roomCapacity} ({Math.round(percentage)}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-3 ${bgColor} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-in-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      <div className="mt-2 flex items-start gap-2">
        <span className={`text-xs font-medium ${textColor}`}>
          {statusText}
        </span>
        {isOverCapacity && (
          <p className="text-xs text-red-600">
            ⚠️ Warning: The number of attendees exceeds room capacity. Consider selecting a larger room or reducing attendees.
          </p>
        )}
        {isNearCapacity && !isOverCapacity && (
          <p className="text-xs text-amber-600">
            ℹ️ Room is near full capacity
          </p>
        )}
      </div>
    </div>
  );
}
