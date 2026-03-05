/**
 * Zoom integration (mock). Replace with real Zoom API when ready.
 */

export interface CreateMeetingOptions {
  topic: string;
  startTime: Date;
  durationMinutes?: number;
}

export interface MeetingResult {
  id: string;
  joinUrl: string;
  startUrl?: string;
}

export class ZoomService {
  async createMeeting(_options: CreateMeetingOptions): Promise<MeetingResult> {
    const id = `zoom-mock-${Date.now()}`;
    return {
      id,
      joinUrl: `https://zoom.us/j/${id}`,
      startUrl: `https://zoom.us/s/${id}`,
    };
  }
}
