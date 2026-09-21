import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreLead, SPAM_SCORE_THRESHOLD } from './spam-score';

const FIX_MY_VIBE_CODES_PITCH = `Hello,

I noticed Vizantir builds sites for serious companies, and a lot of those projects start as vibe-coded prototypes. We offer a free audit and a health check of the codebase, no obligation.

Our engineers can take that prototype and make it production-ready. We help teams who are stuck between a demo and something they can actually launch.

You can see how we work at https://fixmyvibecodes.com.

Warm regards,
Jordan Hale
FixMyVibeCodes`;

const KAD_INFOTECH_PITCH = `Attention to CEO,

My name is Anil and I am with KAD InfoTech, a software development company. We provide outsourcing and offshore dedicated developers who can work white label for your studio.

Our team specializes in web and mobile products for US agencies. More at https://kadinfotech.com.

Warm regards,
Anil Ker
KAD InfoTech`;

describe('scoreLead', () => {
  it('flags the FixMyVibeCodes pitch', () => {
    const result = scoreLead({
      name: 'Jordan Hale',
      email: 'jordan@fixmyvibecodes.com',
      phone: '+44 20 7946 0958',
      company: 'FixMyVibeCodes',
      message: FIX_MY_VIBE_CODES_PITCH,
    });

    assert.ok(result.score >= SPAM_SCORE_THRESHOLD);
    assert.ok(result.reasons.length >= 2);
  });

  it('flags the KAD InfoTech pitch', () => {
    const result = scoreLead({
      name: 'Anil Ker',
      email: 'anil@kadinfotech.com',
      phone: '+91 75676 55839',
      company: 'KAD InfoTech',
      message: KAD_INFOTECH_PITCH,
    });

    assert.ok(result.score >= SPAM_SCORE_THRESHOLD);
    assert.ok(result.reasons.length >= 2);
  });

  it('scores a normal local inquiry below the threshold', () => {
    const result = scoreLead({
      name: 'Sarah Chen',
      email: 'sarah@hendersonfamilydental.com',
      phone: '(702) 555-0198',
      company: 'Henderson Family Dental',
      message:
        "Hi, we're a dental group in Henderson looking to redo our site, budget around 30k, can we set up a call?",
    });

    assert.ok(result.score < SPAM_SCORE_THRESHOLD);
    assert.deepEqual(result.reasons, []);
  });

  it('does not flag a single weak signal', () => {
    const result = scoreLead({
      name: 'Sarah Chen',
      email: 'sarah@hendersonfamilydental.com',
      phone: '(702) 555-0198',
      company: 'Henderson Family Dental',
      message: 'Our current site is https://example.com and we want a redesign.',
    });

    assert.equal(result.score, 1);
    assert.ok(result.score < SPAM_SCORE_THRESHOLD);
  });
});
