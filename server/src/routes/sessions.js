const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// All session routes require authentication
router.use(authMiddleware);

// POST /api/sessions
// Starts a new interview session for the logged-in user
router.post('/', async (req, res) => {
  try {
    const session = await prisma.session.create({
      data: {
        userId: req.user.id,
        status: 'active',
      },
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session.' });
  }
});

// GET /api/sessions
// Returns all sessions for the logged-in user, most recent first
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      include: {
        feedback: {
          select: { overallScore: true },
        },
        // Count messages to show how long the interview was
        _count: { select: { messages: true } },
      },
    });

    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Failed to load sessions.' });
  }
});

// GET /api/sessions/:id
// Returns a single session with its full transcript (messages)
router.get('/:id', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id, // ensure user can only see their own sessions
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        feedback: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json({ session });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to load session.' });
  }
});

// PATCH /api/sessions/:id/end
// Marks a session as completed and records the end time
router.patch('/:id/end', async (req, res) => {
  try {
    // Verify the session belongs to the user
    const existing = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    if (existing.status === 'completed') {
      return res.json({ session: existing }); // already ended, that's fine
    }

    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        endedAt: new Date(),
      },
    });

    res.json({ session });
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({ error: 'Failed to end session.' });
  }
});

module.exports = router;
