const twilio = require('twilio');

function validateTwilioSignature(req, res, next) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    console.error('[TwilioAuth] TWILIO_AUTH_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[TwilioAuth] Skipping validation in development mode');
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    authToken,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    console.error('[TwilioAuth] Invalid Twilio signature');
    return res.status(403).json({ error: 'Forbidden' });
  }

  console.log('[TwilioAuth] Valid Twilio signature');
  next();
}

module.exports = { validateTwilioSignature };
