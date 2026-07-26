import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INTENTS,
  ROUTES,
  buildIdempotencyKey,
  classifyIntent,
  routeMessage,
  toHubSpotLead,
} from '../lib/juss-beautiful-hair/message-policy.mjs';

test('classifies the five core customer intents', () => {
  assert.equal(classifyIntent('How much are bundles?'), INTENTS.PRICE);
  assert.equal(classifyIntent('I want to shop for a wig'), INTENTS.SHOP);
  assert.equal(classifyIntent('Where is my order?'), INTENTS.ORDER_STATUS);
  assert.equal(classifyIntent('Do you offer pickup?'), INTENTS.SHIPPING_PICKUP);
  assert.equal(classifyIntent('I need a human'), INTENTS.HUMAN);
});

test('routes order status and explicit human requests to review', () => {
  for (const message of ['Track my order', 'Talk to Juss']) {
    const result = routeMessage({ message });
    assert.equal(result.route, ROUTES.HUMAN_REVIEW);
    assert.equal(result.replyAllowed, false);
  }
});

test('blocks unverified inventory, delivery, refund, and discount claims', () => {
  for (const message of [
    'Is this in stock?',
    'Will it arrive Friday?',
    'Can I get a refund?',
    'Give me a discount',
    'Is it ready for pickup?',
  ]) {
    const result = routeMessage({ message });
    assert.equal(result.route, ROUTES.HUMAN_REVIEW, message);
    assert.equal(result.replyAllowed, false, message);
    assert.equal(result.reason, 'unverified_business_fact', message);
  }
});

test('allows only an explicitly approved FAQ answer', () => {
  const result = routeMessage({
    message: 'How much are bundles?',
    approvedFaqAnswer: 'Approved catalog answer',
  });

  assert.equal(result.route, ROUTES.AUTOMATED_FAQ);
  assert.equal(result.replyAllowed, true);
  assert.equal(result.answer, 'Approved catalog answer');
});

test('builds stable event keys and rejects incomplete trace data', () => {
  assert.equal(
    buildIdempotencyKey({ pageId: '235882889600658', senderId: 'customer-1', messageId: 'mid.1' }),
    '235882889600658:customer-1:mid.1',
  );

  assert.throws(
    () => buildIdempotencyKey({ pageId: '235882889600658', senderId: '', messageId: 'mid.1' }),
    /required/,
  );
});

test('maps a review-safe HubSpot lead payload without claiming consent', () => {
  const lead = toHubSpotLead({
    customerName: 'Customer',
    message: 'Where is my order?',
    consent: false,
    trace: {
      pageId: '235882889600658',
      senderId: 'customer-1',
      messageId: 'mid.1',
    },
  });

  assert.equal(lead.source, 'Facebook Messenger');
  assert.equal(lead.business, 'Juss Beautiful Hair');
  assert.equal(lead.intent, INTENTS.ORDER_STATUS);
  assert.equal(lead.humanFollowUpRequired, true);
  assert.equal(lead.consentStatus, 'not_granted');
  assert.deepEqual(lead.trace, {
    pageId: '235882889600658',
    senderId: 'customer-1',
    messageId: 'mid.1',
  });
});
