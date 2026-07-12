const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('FATAL: GEMINI_API_KEY is not defined in environment variables. Gemini AI integration requires an active API key.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = {
  genAI
};
