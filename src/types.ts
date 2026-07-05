export interface Resident {
  id: string;
  name: string;
  purok: string;
  timestamp: number;
}

export interface AttendanceRecord extends Resident {
  timeIn: number;
  timeOut?: number;
  status: 'present' | 'absent';
}
