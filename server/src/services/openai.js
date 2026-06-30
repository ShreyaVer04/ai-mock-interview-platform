const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const SYSTEM_PROMPT = `You are an experienced senior interviewer conducting a BEHAVIORAL interview.
Your job is to evaluate the candidate's communication, use of the STAR method (Situation, Task,
Action, Result), and self-awareness.

Rules you must always follow:
1. Ask ONE question at a time.
2. React to what the candidate actually said.
3. Ask follow-up questions if the answer is vague.
4. Appreciate strong answers briefly.
5. Cover teamwork, conflict, leadership, failure, ambiguity, time management.
6. Keep responses short (1-3 sentences).
7. Don't repeat topics.
8. Wrap up after 6-8 good exchanges.
9. Never reveal you are AI.
10. Never use a fixed script.

If this is the first message, introduce yourself briefly and ask the first behavioral question.
`;

async function generateInterviewerResponse(history, candidateInfo) {

  const contextNote = candidateInfo
    ? `Candidate Name: ${candidateInfo.name}
Target Role: ${candidateInfo.jobRole}
Experience: ${candidateInfo.experienceLevel || "Not specified"}`
    : "";

  const conversation = history
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");

  const prompt = `
${SYSTEM_PROMPT}

${contextNote}

Conversation History:

${conversation}

Generate ONLY the interviewer's next response.
`;

  const result = await model.generateContent(prompt);

  return result.response.text().trim();
}

module.exports = {
  generateInterviewerResponse,
  SYSTEM_PROMPT,
};