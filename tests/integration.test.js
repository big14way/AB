const request = require('supertest');
const { expect } = require('chai');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '0'.repeat(64);
process.env.BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';
process.env.BRIDGE_CONTRACT_ADDRESS = process.env.BRIDGE_CONTRACT_ADDRESS || '0xC3a201c2Dc904ae32a9a0adea3478EB252d5Cf88';
process.env.USDC_ADDRESS_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
process.env.FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'test_secret';
process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'test_sid';
process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'test_token';
process.env.CIRCLE_API_KEY = process.env.CIRCLE_API_KEY || 'test_circle_key';
process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test_admin_key';

describe('AfriBridge Integration Tests', () => {
  let app;
  let server;

  before(() => {
    // Import app after env vars are set
    app = require('../backend/server');
  });

  after((done) => {
    if (server && server.close) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('Health & Status Endpoints', () => {
    it('should return health status', (done) => {
      request(app)
        .get('/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('status', 'ok');
          expect(res.body).to.have.property('timestamp');
          done();
        });
    });

    it('should return service status', (done) => {
      request(app)
        .get('/status')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('service', 'AfriBridge API');
          expect(res.body).to.have.property('version', '1.0.0');
          done();
        });
    });
  });

  describe('Bridge Contract Integration', () => {
    it('should get bridge contract balance', (done) => {
      request(app)
        .get('/bridge/balance')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('balance');
          expect(res.body).to.have.property('balanceWei');
          done();
        });
    });

    it('should reject deposit with invalid parameters', (done) => {
      request(app)
        .post('/bridge/deposit')
        .send({
          recipient: '0x0000000000000000000000000000000000000000',
          amount: 0
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });

    it('should validate recipient address format', (done) => {
      request(app)
        .post('/bridge/deposit')
        .send({
          recipient: 'invalid_address',
          amount: 100
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          expect(res.body.error).to.include('address');
          done();
        });
    });
  });

  describe('WhatsApp Bot Flow', () => {
    const testPhone = 'whatsapp:+254712345678';

    it('should handle WELCOME message', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .send({
          From: testPhone,
          Body: 'hello'
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.include('Welcome to AfriBridge');
          done();
        });
    });

    it('should handle help command', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .send({
          From: testPhone,
          Body: 'help'
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.include('AfriBridge Help');
          done();
        });
    });

    it('should parse amount correctly', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .send({
          From: testPhone,
          Body: 'send'
        })
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          // Follow up with amount
          request(app)
            .post('/webhook/whatsapp')
            .send({
              From: testPhone,
              Body: '1000'
            })
            .expect(200)
            .end((err2, res2) => {
              if (err2) return done(err2);
              expect(res2.text).to.include('recipient');
              done();
            });
        });
    });

    it('should validate ethereum address format', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .send({
          From: 'whatsapp:+254700000001',
          Body: 'send'
        })
        .expect(200)
        .end(() => {
          request(app)
            .post('/webhook/whatsapp')
            .send({
              From: 'whatsapp:+254700000001',
              Body: '500'
            })
            .expect(200)
            .end(() => {
              request(app)
                .post('/webhook/whatsapp')
                .send({
                  From: 'whatsapp:+254700000001',
                  Body: 'invalid_eth_address'
                })
                .expect(200)
                .end((err, res) => {
                  if (err) return done(err);
                  expect(res.text).to.include('valid Ethereum address');
                  done();
                });
            });
        });
    });

    it('should handle cancel command', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .send({
          From: 'whatsapp:+254700000002',
          Body: 'send'
        })
        .expect(200)
        .end(() => {
          request(app)
            .post('/webhook/whatsapp')
            .send({
              From: 'whatsapp:+254700000002',
              Body: 'cancel'
            })
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.text).to.include('cancelled');
              done();
            });
        });
    });
  });

  describe('Payment Flow Simulation', () => {
    it('should generate payment link', (done) => {
      request(app)
        .post('/payment/create')
        .send({
          amount: 1000,
          currency: 'KES',
          phoneNumber: '+254712345678',
          txRef: 'TEST_REF_001'
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('paymentLink');
          done();
        });
    });

    it('should handle payment callback', (done) => {
      request(app)
        .post('/callback/flutterwave')
        .send({
          event: 'charge.completed',
          data: {
            tx_ref: 'TEST_REF_002',
            amount: 1000,
            status: 'successful',
            customer: {
              phone_number: '+254712345678'
            }
          }
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('status');
          done();
        });
    });

    it('should reject duplicate transaction refs', (done) => {
      const txRef = 'DUP_TEST_' + Date.now();
      
      request(app)
        .post('/payment/create')
        .send({
          amount: 500,
          currency: 'KES',
          phoneNumber: '+254700000001',
          txRef: txRef
        })
        .expect(200)
        .end((err) => {
          if (err) return done(err);
          
          // Try to create again with same ref
          request(app)
            .post('/payment/create')
            .send({
              amount: 500,
              currency: 'KES',
              phoneNumber: '+254700000001',
              txRef: txRef
            })
            .expect(400)
            .end((err2, res2) => {
              if (err2) return done(err2);
              expect(res2.body).to.have.property('success', false);
              done();
            });
        });
    });
  });

  describe('Off-ramp Flow', () => {
    it('should handle withdrawal request', (done) => {
      request(app)
        .post('/fulfill')
        .set('Authorization', 'Bearer test_admin_key')
        .send({
          txRef: 'WITHDRAW_' + Date.now(),
          phoneNumber: '+254712345678',
          amountKES: 5000,
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', true);
          done();
        });
    });

    it('should reject withdrawal without auth', (done) => {
      request(app)
        .post('/fulfill')
        .send({
          txRef: 'UNAUTH_' + Date.now(),
          phoneNumber: '+254712345678',
          amountKES: 1000,
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0'
        })
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', (done) => {
      request(app)
        .get('/unknown-route')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });

    it('should validate required fields', (done) => {
      request(app)
        .post('/payment/create')
        .send({
          // Missing required fields
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          done();
        });
    });

    it('should handle malformed JSON', (done) => {
      request(app)
        .post('/webhook/whatsapp')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400)
        .end(() => {
          done();
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', function(done) {
      this.timeout(5000);
      
      const requests = [];
      
      // Make 110 requests (limit is 100 in 15 min)
      for (let i = 0; i < 110; i++) {
        requests.push(
          request(app)
            .post('/webhook/whatsapp')
            .send({
              From: 'whatsapp:+254700000000',
              Body: 'test'
            })
        );
      }
      
      Promise.all(requests)
        .then(() => {
          done(new Error('Should have been rate limited'));
        })
        .catch(() => {
          // Expected to fail due to rate limiting
          done();
        });
    });
  });

  describe('Session Management', () => {
    it('should create and retrieve session', (done) => {
      const sessionStore = require('../backend/utils/sessionStore');
      const testPhone = 'whatsapp:+254700111222';
      
      sessionStore.create(testPhone, {
        state: 'AMOUNT',
        data: { test: true }
      });
      
      const session = sessionStore.get(testPhone);
      expect(session).to.exist;
      expect(session.state).to.equal('AMOUNT');
      expect(session.data.test).to.be.true;
      
      sessionStore.delete(testPhone);
      done();
    });

    it('should expire old sessions', function(done) {
      this.timeout(3000);
      const sessionStore = require('../backend/utils/sessionStore');
      const testPhone = 'whatsapp:+254700111223';
      
      // Create session with old timestamp
      sessionStore.create(testPhone, {
        state: 'AMOUNT',
        data: {}
      });
      
      // Manually set old timestamp (31 minutes ago)
      const session = sessionStore.get(testPhone);
      session.timestamp = Date.now() - (31 * 60 * 1000);
      
      // Run cleanup
      sessionStore.cleanup();
      
      // Session should be deleted
      const deletedSession = sessionStore.get(testPhone);
      expect(deletedSession).to.be.null;
      
      done();
    });
  });
});

describe('Message Parser Unit Tests', () => {
  const { parseRemittanceMessage, generateTxRef } = require('../backend/utils/messageParser');

  it('should parse "send 1000 to 0x..." format', () => {
    const result = parseRemittanceMessage('send 1000 to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
    expect(result).to.not.be.null;
    expect(result.amount).to.equal(1000);
    expect(result.recipient).to.equal('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
  });

  it('should parse "1000 KES to 0x..." format', () => {
    const result = parseRemittanceMessage('1000 KES to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
    expect(result).to.not.be.null;
    expect(result.amount).to.equal(1000);
    expect(result.currency).to.equal('KES');
  });

  it('should return null for invalid format', () => {
    const result = parseRemittanceMessage('invalid message');
    expect(result).to.be.null;
  });

  it('should generate unique transaction refs', () => {
    const ref1 = generateTxRef();
    const ref2 = generateTxRef();
    
    expect(ref1).to.not.equal(ref2);
    expect(ref1).to.match(/^ABR-\d+-[A-Z0-9]{6}$/);
  });
});
