export default function handler(req, res) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say>Connecting you now.</Say>
      <Transfer>
        <Number>+17177362829</Number>
      </Transfer>
    </Response>`);
}

