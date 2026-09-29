const crypto = require('crypto');
const https = require('https');

const API_KEY = process.env.NOWPAYMENTS_API_KEY || 'DEMO_KEY_BURAYA';
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || 'DEMO_SECRET_BURAYA';
const API_URL = 'https://api.nowpayments.io/v1';

function apiCall(endpoint, method, data) {
  return new Promise(function(resolve, reject) {
    var body = data ? JSON.stringify(data) : null;
    var url = new URL(API_URL + endpoint);
    var opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method || 'GET',
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
    };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    var req = https.request(opts, function(res) {
      var chunks = '';
      res.on('data', function(c) { chunks += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(chunks)); }
        catch (e) { reject(new Error('API parse: ' + chunks)); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function createCryptoPayment(orderId, amountUsd, plan) {
  try {
    var res = await apiCall('/payment', 'POST', {
      price_amount: amountUsd,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id: orderId,
      order_description: 'Meydan VIP - ' + plan,
      ipn_callback_url: 'http://127.0.0.1:8083/webhook/nowpayments',
      is_fixed_rate: true,
      is_fee_paid_by_user: false
    });
    if (res && res.pay_address) {
      return {
        success: true,
        paymentId: res.payment_id,
        payAddress: res.pay_address,
        payAmount: res.pay_amount,
        payCurrency: res.pay_currency,
        status: res.payment_status
      };
    }
    return { success: false, error: (res && res.message) || 'Odeme olusturulamadi' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function verifyWebhookSignature(rawBody, signature) {
  if (!IPN_SECRET || IPN_SECRET === 'DEMO_SECRET_BURAYA') return true;
  var hmac = crypto.createHmac('sha512', IPN_SECRET);
  hmac.update(rawBody);
  return hmac.digest('hex') === signature;
}

async function getPaymentStatus(paymentId) {
  try { return await apiCall('/payment/' + paymentId, 'GET'); }
  catch (e) { return { error: e.message }; }
}

module.exports = {
  createCryptoPayment: createCryptoPayment,
  verifyWebhookSignature: verifyWebhookSignature,
  getPaymentStatus: getPaymentStatus,
  API_KEY: API_KEY,
  IPN_SECRET: IPN_SECRET
};
