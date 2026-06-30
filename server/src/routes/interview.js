const express = require('express');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('../middleware/auth');
const { generateInterviewerResponse } = require('../services/openai');

const router = express.Router();
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// POST /api/interview/turn
// Called by the FRONTEND right after the candidate's session starts, and any
// time we need the AI's next message outside of the Vapi webhook flow
// (e.g. for testing without Vapi, or to fetch the opening line).
// Requires a normal logged-in user JWT.
// ---------------------------------------------------------------------------
router.post('/turn', authMiddleware, async (req, res) => {
  try {
    const { sessionId, candidateMessage } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, user: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Save the candidate's message first (if provided)
    if (candidateMessage) {
      await prisma.message.create({
        data: { sessionId, role: 'user', content: candidateMessage },
      });
    }

    // Reload full history including the message we just saved
    const history = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const aiResponse = await generateInterviewerResponse(
      history.map((m) => ({ role: m.role, content: m.content })),
      {
        name: session.user.name,
        jobRole: session.user.jobRole,
      }
    );

    // Save the AI's response
    await prisma.message.create({
      data: { sessionId, role: 'assistant', content: aiResponse },
    });

    res.json({ message: aiResponse });
  } catch (err) {
    console.error('Interview turn error:', err);
    res.status(500).json({ error: 'Failed to generate interviewer response.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/interview/vapi-webhook
// This is the endpoint Vapi calls during a LIVE voice call. Vapi sends the
// conversation so far and expects us to return the assistant's next message.
// This route receives RAW body (configured in index.js) so we can verify
// the webhook signature before trusting the payload.
// ---------------------------------------------------------------------------
router.post('/vapi-webhook', async (req, res) => {
  try {
    // Verify webhook signature so random people can't hit this endpoint
    const signature = req.headers['x-vapi-signature'];
    const secret = process.env.VAPI_WEBHOOK_SECRET;

    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(req.body)
        .digest('hex');

      if (signature !== expected) {
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const payload = JSON.parse(req.body.toString());
    const message = payload.message;

    // We only care about the "assistant-request" / "conversation-update" type events
    // where Vapi wants us to generate the next message
    if (!message || message.type !== 'assistant-request') {
      // Acknowledge other event types without doing anything (status updates, end-of-call, etc.)
      return res.status(200).json({ received: true });
    }

    // Vapi sends sessionId via call metadata (we set this when creating the call)
    const sessionId = payload.call?.metadata?.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId in call metadata.' });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const history = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const aiResponse = await generateInterviewerResponse(
      history.map((m) => ({ role: m.role, content: m.content })),
      { name: session.user.name, jobRole: session.user.jobRole }
    );

    await prisma.message.create({
      data: { sessionId, role: 'assistant', content: aiResponse },
    });

    // Respond in the format Vapi expects for an assistant-request response
    res.status(200).json({
      assistant: {
        firstMessage: aiResponse,
      },
    });
  } catch (err) {
    console.error('Vapi webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/interview/transcript-sync
// Vapi can also call this after each user utterance is transcribed, so we
// keep our own DB transcript in sync in real time (used for the live
// on-screen transcript and as backup in case the assistant-request flow
// above is bypassed by certain Vapi call modes).
// ---------------------------------------------------------------------------
router.post('/transcript-sync', authMiddleware, async (req, res) => {
  try {
    const { sessionId, role, content } = req.body;

    if (!sessionId || !role || !content) {
      return res.status(400).json({ error: 'sessionId, role and content are required.' });
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const saved = await prisma.message.create({
      data: { sessionId, role, content },
    });

    res.status(201).json({ message: saved });
  } catch (err) {
    console.error('Transcript sync error:', err);
    res.status(500).json({ error: 'Failed to sync transcript.' });
  }
});

module.exports = router;
