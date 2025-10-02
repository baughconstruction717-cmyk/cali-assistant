const { google } = require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT; // paste full JSON in Vercel env
  if (!keyJson) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT env var");
  const credentials = JSON.parse(keyJson);
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Use POST with JSON body" });
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};
    if (!action) {
      res.status(400).json({ error: "Missing 'action' (create_event | update_event | delete_event)" });
      return;
    }

    const auth = getAuth();
    const calendar = google.calendar({ version: "v3", auth });

    if (action === "create_event") {
      const { title, description, start_time, end_time, location } = payload || {};
      const r = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: title,
          description,
          start: { dateTime: start_time },
          end: { dateTime: end_time },
          location
        }
      });
      res.status(200).json({ ok: true, event: r.data });

    } else if (action === "update_event") {
      const { event_id, updates } = payload || {};
      const r = await calendar.events.patch({
        calendarId: "primary",
        eventId: event_id,
        requestBody: updates
      });
      res.status(200).json({ ok: true, event: r.data });

    } else if (action === "delete_event") {
      const { event_id } = payload || {};
      await calendar.events.delete({
        calendarId: "primary",
        eventId: event_id
      });
      res.status(200).json({ ok: true, deleted: event_id });

    } else {
      res.status(400).json({ error: "Unsupported action" });
    }
  } catch (err) {
    console.error("Calendar error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
