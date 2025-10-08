function parseRemittanceMessage(message) {
  const text = message.trim().toLowerCase();
  
  const patterns = [
    /send\s+(\d+(?:\.\d+)?)\s*([a-z]{3})\s+to\s+(\+?\d+)/i,
    /transfer\s+(\d+(?:\.\d+)?)\s*([a-z]{3})\s+to\s+(\+?\d+)/i,
    /(\d+(?:\.\d+)?)\s*([a-z]{3})\s+to\s+(\+?\d+)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        valid: true,
        amount: parseFloat(match[1]),
        currency: match[2].toUpperCase(),
        recipientPhone: match[3]
      };
    }
  }

  return {
    valid: false,
    error: 'Invalid format. Use: "Send 1000 KES to +254712345678"'
  };
}

function generateTxRef() {
  return `AFRIB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  parseRemittanceMessage,
  generateTxRef
};
