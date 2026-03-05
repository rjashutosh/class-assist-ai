/**
 * Creates one test class via the API so you can verify Calendar + Zoom + email.
 * Run with: npm run create-test-class (with server running on port 3001)
 */
const API = "http://localhost:3001/api";

async function main() {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "teacher@classassist.ai",
      password: "teacher123",
    }),
  });
  if (!res.ok) {
    console.error("Login failed:", await res.text());
    process.exit(1);
  }
  const { token } = (await res.json()) as { token: string };
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = "15:00";
  const body = {
    intent: "schedule_class",
    studentName: "Alice",
    subject: "Math",
    date,
    time,
  };
  const exec = await fetch(`${API}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await exec.json()) as { success?: boolean; class?: unknown; error?: string };
  if (!exec.ok || !data.success) {
    console.error("Schedule failed:", data);
    process.exit(1);
  }
  console.log("Test class created:");
  console.log("  Date:", date, "Time:", time);
  console.log("  Student: Alice");
  console.log("  Class:", JSON.stringify(data.class, null, 2));
  console.log("\nNext: Open http://localhost:5173/dashboard → Calendar. Click the event to see Class Details + Zoom Link.");
  console.log("If Alice has email in DB, check Ethereal for the invite email.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
