const express = require("express");
const { PrismaClient } = require("@prisma/client");

const authMiddleware = require("../middleware/auth");
const { generateFeedbackReport } = require("../services/feedback");

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// POST /api/feedback/:sessionId
router.post("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: req.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found.",
      });
    }

    if (session.messages.length < 2) {
      return res.status(400).json({
        error: "Not enough conversation to generate feedback.",
      });
    }

    // Generate AI feedback
    const result = await generateFeedbackReport(
      session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
    );

    // Create OR Update feedback
    const feedback = await prisma.feedback.upsert({
      where: {
        sessionId,
      },
      update: {
        overallScore: result.overallScore,
        communicationScore: result.communicationScore,
        starStructureScore: result.starStructureScore,
        selfAwarenessScore: result.selfAwarenessScore,
        strengths: result.strengths,
        improvements: result.improvements,
        fullReport: result.fullReport,
      },
      create: {
        sessionId,
        overallScore: result.overallScore,
        communicationScore: result.communicationScore,
        starStructureScore: result.starStructureScore,
        selfAwarenessScore: result.selfAwarenessScore,
        strengths: result.strengths,
        improvements: result.improvements,
        fullReport: result.fullReport,
      },
    });

    // Mark interview completed
    await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "completed",
        endedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      feedback,
    });
  } catch (err) {
    console.error("Generate feedback error:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// GET /api/feedback/:sessionId
router.get("/:sessionId", async (req, res) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: {
        sessionId: req.params.sessionId,
      },
    });

    if (!feedback) {
      return res.status(404).json({
        error: "Feedback not found.",
      });
    }

    res.json({
      success: true,
      feedback,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Unable to fetch feedback.",
    });
  }
});

module.exports = router;