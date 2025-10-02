export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  // Replace with YOUR Telnyx number as callerId (E.164 format)
  const callerId = "+17177362829"; // example; set to your business number
  const forwardTo = "+17177362829"; // the personal line to warm-transfer to

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="female">Connecting you to a live technician now.</Say>
      <Dial callerId="${callerId}">${forwardTo}</Dial>
    </Response>`);
}

