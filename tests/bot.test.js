const { expect } = require('chai');

describe('WhatsApp Bot State Machine Tests', () => {
  let BotHandler;
  let botHandler;
  let sentMessages = [];

  before(() => {
    // Mock sendMessage function
    const mockSendMessage = async (to, message) => {
      sentMessages.push({ to, message });
      return { success: true, sid: 'MOCK-' + Date.now() };
    };

    BotHandler = require('../backend/botHandler').BotHandler;
    botHandler = new BotHandler(mockSendMessage);
  });

  beforeEach(() => {
    sentMessages = [];
    // Clear sessions before each test
    const sessionStore = require('../backend/utils/sessionStore');
    sessionStore.sessions = {};
  });

  describe('State: WELCOME', () => {
    it('should respond to greeting messages', async () => {
      const responses = ['hello', 'hi', 'hey', 'start'];
      
      for (const msg of responses) {
        sentMessages = [];
        await botHandler.handleMessage('whatsapp:+254700000001', msg);
        expect(sentMessages).to.have.lengthOf(1);
        expect(sentMessages[0].message).to.include('Welcome to AfriBridge');
      }
    });

    it('should handle help command', async () => {
      await botHandler.handleMessage('whatsapp:+254700000002', 'help');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('AfriBridge Help');
    });

    it('should initiate send flow', async () => {
      await botHandler.handleMessage('whatsapp:+254700000003', 'send');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('How much');
    });
  });

  describe('State: AMOUNT', () => {
    beforeEach(async () => {
      // Initialize session in AMOUNT state
      await botHandler.handleMessage('whatsapp:+254700000004', 'send');
      sentMessages = [];
    });

    it('should accept valid amount', async () => {
      await botHandler.handleMessage('whatsapp:+254700000004', '1000');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('recipient');
    });

    it('should reject zero amount', async () => {
      await botHandler.handleMessage('whatsapp:+254700000004', '0');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('greater than 0');
    });

    it('should reject negative amount', async () => {
      await botHandler.handleMessage('whatsapp:+254700000004', '-500');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('valid amount');
    });

    it('should reject non-numeric input', async () => {
      await botHandler.handleMessage('whatsapp:+254700000004', 'abc');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('valid number');
    });

    it('should handle very large amounts', async () => {
      await botHandler.handleMessage('whatsapp:+254700000004', '1000000');
      expect(sentMessages).to.have.lengthOf(1);
      // Should either accept or warn about large amount
      expect(sentMessages[0].message).to.exist;
    });
  });

  describe('State: RECIPIENT', () => {
    beforeEach(async () => {
      // Initialize session in RECIPIENT state
      await botHandler.handleMessage('whatsapp:+254700000005', 'send');
      await botHandler.handleMessage('whatsapp:+254700000005', '2000');
      sentMessages = [];
    });

    it('should accept valid Ethereum address', async () => {
      await botHandler.handleMessage(
        'whatsapp:+254700000005',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
      );
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('Confirm');
    });

    it('should accept checksummed address', async () => {
      await botHandler.handleMessage(
        'whatsapp:+254700000005',
        '0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88'
      );
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('Confirm');
    });

    it('should reject invalid address format', async () => {
      await botHandler.handleMessage('whatsapp:+254700000005', 'invalid_address');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('valid Ethereum address');
    });

    it('should reject short address', async () => {
      await botHandler.handleMessage('whatsapp:+254700000005', '0x123');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('valid Ethereum address');
    });

    it('should reject zero address', async () => {
      await botHandler.handleMessage(
        'whatsapp:+254700000005',
        '0x0000000000000000000000000000000000000000'
      );
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('cannot send to zero address');
    });
  });

  describe('State: CONFIRM', () => {
    beforeEach(async () => {
      // Initialize session in CONFIRM state
      await botHandler.handleMessage('whatsapp:+254700000006', 'send');
      await botHandler.handleMessage('whatsapp:+254700000006', '3000');
      await botHandler.handleMessage(
        'whatsapp:+254700000006',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
      );
      sentMessages = [];
    });

    it('should accept confirmation', async () => {
      await botHandler.handleMessage('whatsapp:+254700000006', 'yes');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('payment link');
    });

    it('should handle no/cancel', async () => {
      await botHandler.handleMessage('whatsapp:+254700000006', 'no');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('cancelled');
    });

    it('should handle edit amount request', async () => {
      await botHandler.handleMessage('whatsapp:+254700000006', 'edit amount');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('How much');
    });

    it('should handle edit recipient request', async () => {
      await botHandler.handleMessage('whatsapp:+254700000006', 'edit recipient');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('recipient');
    });
  });

  describe('State: PAY', () => {
    it('should handle payment link generation', async () => {
      await botHandler.handleMessage('whatsapp:+254700000007', 'send');
      await botHandler.handleMessage('whatsapp:+254700000007', '5000');
      await botHandler.handleMessage(
        'whatsapp:+254700000007',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
      );
      await botHandler.handleMessage('whatsapp:+254700000007', 'yes');
      
      const lastMessage = sentMessages[sentMessages.length - 1].message;
      expect(lastMessage).to.include('payment link');
      expect(lastMessage).to.include('http');
    });

    it('should handle payment status check', async () => {
      await botHandler.handleMessage('whatsapp:+254700000008', 'status');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.exist;
    });
  });

  describe('Cancel Command', () => {
    it('should cancel transaction at any state', async () => {
      const phone = 'whatsapp:+254700000009';
      
      // Start transaction
      await botHandler.handleMessage(phone, 'send');
      sentMessages = [];
      
      // Cancel it
      await botHandler.handleMessage(phone, 'cancel');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('cancelled');
      
      // Session should be cleared
      const sessionStore = require('../backend/utils/sessionStore');
      const session = sessionStore.get(phone);
      expect(session).to.be.null;
    });
  });

  describe('Unknown Commands', () => {
    it('should handle unknown commands gracefully', async () => {
      await botHandler.handleMessage('whatsapp:+254700000010', 'unknown_command');
      expect(sentMessages).to.have.lengthOf(1);
      expect(sentMessages[0].message).to.include('help');
    });
  });

  describe('Multi-user Isolation', () => {
    it('should maintain separate sessions for different users', async () => {
      const user1 = 'whatsapp:+254700000011';
      const user2 = 'whatsapp:+254700000012';
      
      // User 1 starts transaction
      await botHandler.handleMessage(user1, 'send');
      await botHandler.handleMessage(user1, '1000');
      
      // User 2 starts different transaction
      await botHandler.handleMessage(user2, 'send');
      await botHandler.handleMessage(user2, '2000');
      
      // Check sessions are independent
      const sessionStore = require('../backend/utils/sessionStore');
      const session1 = sessionStore.get(user1);
      const session2 = sessionStore.get(user2);
      
      expect(session1.data.amount).to.equal(1000);
      expect(session2.data.amount).to.equal(2000);
    });
  });
});
