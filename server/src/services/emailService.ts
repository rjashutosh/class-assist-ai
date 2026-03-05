import nodemailer from "nodemailer";

export interface SendClassInviteParams {
  studentEmail: string;
  studentName: string;
  meetingLink: string;
  classTime: Date | string;
}

const SUBJECT = "Your Class Invitation";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: port ? parseInt(port, 10) : 587,
      secure: false,
      auth: { user, pass },
    });
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

/**
 * Sends a class invitation email to the student with the Zoom meeting link.
 */
export async function sendClassInvite({
  studentEmail,
  studentName,
  meetingLink,
  classTime,
}: SendClassInviteParams): Promise<void> {
  const timeStr = typeof classTime === "string" ? classTime : new Date(classTime).toLocaleString();
  const body = `Hello ${studentName},

Your class has been scheduled.

Time: ${timeStr}

Join using Zoom:
${meetingLink}
`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "ClassAssist <noreply@classassist.demo>",
    to: studentEmail,
    subject: SUBJECT,
    text: body,
  });
}
