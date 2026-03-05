/**
 * Google Meet integration (mock). Replace with real Google Calendar/Meet API when ready.
 */

export interface CreateMeetingOptions {
  title: string;
  startTime: Date;
  durationMinutes?: number;
}

export interface MeetingResult {
  id: string;
  meetLink: string;
}

export class GoogleMeetService {
  async createMeeting(_options: CreateMeetingOptions): Promise<MeetingResult> {
    const id = `meet-mock-${Date.now()}`;
    return {
      id,
      meetLink: `https://meet.google.com/${id}`,
    };
  }
}
