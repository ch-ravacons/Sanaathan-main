import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentModerationService } from '../src/app/services/content-moderation.service.js';

const service = new ContentModerationService();

test('moderation approves calm content', async () => {
  const result = await service.moderatePost({
    postId: 'test-post',
    userId: 'user-1',
    content: 'Peaceful meditation reflections on the Bhagavad Gita.'
  });
  assert.equal(result.status, 'approved');
  assert.equal(result.labels.includes('clean'), true);
  assert.ok(result.score > 0.5);
});

test('moderation flags sensitive content', async () => {
  const result = await service.moderatePost({
    postId: 'test-post-2',
    userId: 'user-1',
    content: 'This post promotes violence and hate.'
  });
  assert.equal(result.status, 'flagged');
  assert.equal(result.labels.includes('violence'), true);
  assert.ok(result.score < 0.5);
});
