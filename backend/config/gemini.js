const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let useMock = false;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('WARNING: GEMINI_API_KEY is not defined in environment variables. Gemini API calls will run in MOCK mode.');
  useMock = true;
}

module.exports = {
  genAI,
  useMock
};
