import axios, { type AxiosError } from "axios";

export interface ZoomMeeting {
  meetingId: string;
  meetingLink: string;
}

export interface CreateZoomMeetingParams {
  topic: string;
  startTime: Date;
  duration: number; // minutes
}

const TOKEN_URL = "https://zoom.us/oauth/token";
const MEETINGS_BASE = "https://api.zoom.us/v2";

const MOCK_MEETING: ZoomMeeting = {
  meetingId: "zoom_mock_001",
  meetingLink: "https://zoom.us/j/123456789",
};

function getZoomConfig(): {
  accountId: string;
  clientId: string;
  clientSecret: string;
  hostEmail: string;
} {
  return {
    accountId: process.env.ZOOM_ACCOUNT_ID ?? "",
    clientId: process.env.ZOOM_CLIENT_ID ?? "",
    clientSecret: process.env.ZOOM_CLIENT_SECRET ?? "",
    hostEmail: process.env.ZOOM_HOST_EMAIL ?? "",
  };
}

function hasZoomConfig(): boolean {
  const c = getZoomConfig();
  return Boolean(c.accountId && c.clientId && c.clientSecret && c.hostEmail);
}

/**
 * Obtains a Zoom access token using Server-to-Server OAuth (account credentials grant).
 */
async function getZoomAccessToken(): Promise<string> {
  const { accountId, clientId, clientSecret } = getZoomConfig();
  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf8"
  ).toString("base64");

  const response = await axios.post<{ access_token: string }>(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "account_credentials",
      account_id: accountId,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.access_token;
}

/**
 * Creates a Zoom meeting via the Zoom API. Falls back to mock data if config is missing or the API fails.
 */
export async function createZoomMeeting({
  topic,
  startTime,
  duration,
}: CreateZoomMeetingParams): Promise<ZoomMeeting> {
  if (!hasZoomConfig()) {
    console.warn("[zoomService] ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, or ZOOM_HOST_EMAIL missing in .env — using mock link");
    return MOCK_MEETING;
  }

  const { hostEmail } = getZoomConfig();

  try {
    const accessToken = await getZoomAccessToken();
    const startTimeIso = startTime instanceof Date
      ? startTime.toISOString()
      : new Date(startTime).toISOString();

    const response = await axios.post<{
      id: number;
      join_url: string;
    }>(
      `${MEETINGS_BASE}/users/${encodeURIComponent(hostEmail)}/meetings`,
      {
        topic,
        type: 2,
        start_time: startTimeIso,
        duration,
        timezone: "Asia/Kolkata",
        settings: {
          join_before_host: true,
          waiting_room: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      meetingId: String(response.data.id),
      meetingLink: response.data.join_url,
    };
  } catch (err) {
    const axiosError = err as AxiosError<{ message?: string; code?: number }>;
    const status = axiosError.response?.status;
    const body = axiosError.response?.data;
    const message = (body && typeof body === "object" && "message" in body)
      ? (body as { message: string }).message
      : axiosError.message;
    console.error("[zoomService] createZoomMeeting failed:", status ?? "network", message, body ? JSON.stringify(body) : "");
    return MOCK_MEETING;
  }
}
