const { genAI, useMock } = require('../config/gemini');

// Schema to ensure strict JSON output structure from Gemini
const responseSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    classification: { type: "string" },
    applicableLaws: {
      type: "array",
      items: {
        type: "object",
        properties: {
          law: { type: "string" },
          description: { type: "string" }
        },
        required: ["law", "description"]
      }
    },
    suggestedAuthority: { type: "string" },
    requiredDocuments: {
      type: "array",
      items: { type: "string" }
    },
    stepByStepProcedure: {
      type: "array",
      items: { type: "string" }
    },
    nextActions: {
      type: "array",
      items: { type: "string" }
    },
    preventiveTips: {
      type: "array",
      items: { type: "string" }
    },
    faqs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" }
        },
        required: ["question", "answer"]
      }
    },
    disclaimer: { type: "string" }
  },
  required: [
    "summary", "classification", "applicableLaws", "suggestedAuthority", 
    "requiredDocuments", "stepByStepProcedure", "nextActions", "preventiveTips", 
    "faqs", "disclaimer"
  ]
};

const getMockResponse = (title, description, category) => {
  return {
    summary: `Based on the provided info, the user is experiencing issues regarding: "${title}". Description details: "${description.substring(0, 120)}..."`,
    classification: category || "General Legal Matter",
    applicableLaws: [
      {
        law: "Relevant Code / Section (e.g. Consumer Protection Act / IPC Section)",
        description: "This law governs matters related to the dispute described and outlines standard liabilities and rights."
      },
      {
        law: "Alternative Statutory Remedy",
        description: "Provides specific procedures for mediation or compensation calculations."
      }
    ],
    suggestedAuthority: "Appropriate Judicial / Quasi-Judicial Forum (e.g., Local Police, Consumer Commission, or civil counsel)",
    requiredDocuments: [
      "Copy of transaction invoices / receipts / written agreements",
      "Written communication records (emails, letters, chat logs)",
      "Official government-issued identity cards",
      "Formal legal notice copy (if previously sent)"
    ],
    stepByStepProcedure: [
      "Compile all relevant transaction details and communications chronologically.",
      "Draft a written statement summarizing the grievance and date of occurrence.",
      "Submit the complaint file to the suggested authority or consult a registered advocate.",
      "Keep a stamped or acknowledged copy of the submitted document for legal records."
    ],
    nextActions: [
      "Send a formal written notification outlining your grievance to the counterparty.",
      "Prepare a documentation file containing all proofs.",
      "Visit the recommended local authority office or consult a professional advocate for further representation."
    ],
    preventiveTips: [
      "Ensure all financial transactions and agreements are documented in writing.",
      "Never share confidential authentication details or sign blank papers.",
      "Take screenshots or download backups of digital interactions immediately if disputes arise."
    ],
    faqs: [
      {
        question: "Can I file this complaint online?",
        answer: "Many government agencies, such as the Consumer Forum (e-Daakhil) or National Cyber Crime portal, allow digital filing of preliminary grievances."
      },
      {
        question: "How long does it typically take to get a resolution?",
        answer: "Timeline varies depending on the judicial load and category, ranging from a few weeks in consumer forums to months in formal civil courts."
      }
    ],
    disclaimer: "This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions."
  };
};

/**
 * Generates initial legal guidance analysis for a citizen's complaint
 */
const generateLegalGuidance = async (title, description, category, state, district) => {
  if (useMock) {
    return getMockResponse(title, description, category);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const prompt = `
      You are an expert citizen legal guide. Analyze the following citizen complaint and provide structured informational guidance.
      You must never give definitive legal advice or declare anything with absolute certainty.
      Use non-committal, cautious, and helpful language. For example: "This complaint may relate to..." rather than "This is definitely a breach of..."
      
      COMPLAINT DETAILS:
      - Title: ${title}
      - Category: ${category || "General"}
      - State: ${state}
      - District: ${district}
      - Description: ${description}
      
      Requirements for the JSON response fields:
      - "summary": A concise 2-3 sentence overview of the grievance.
      - "classification": The legal domain this case falls under (e.g. Consumer Dispute, Labour and Employment, Civil Property, Cyber Crime, Criminal Harassment).
      - "applicableLaws": A list of 2-3 potentially applicable statutes, laws or sections with a brief explanation of how they might fit. Highlight that they are informational and may not be exhaustive.
      - "suggestedAuthority": The primary government body, tribunal, court or office the user should approach.
      - "requiredDocuments": 3-5 specific papers, agreements, or evidences the user should collect.
      - "stepByStepProcedure": 3-5 chronological steps the citizen should follow to report or address this issue.
      - "nextActions": 2-3 immediate, practical actions to take.
      - "preventiveTips": 2-3 tips to protect themselves or avoid similar disputes in the future.
      - "faqs": 2 FAQs relevant to this category of dispute with helpful, short answers.
      - "disclaimer": Must be exactly: "This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions."
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    // Fallback to mock response to ensure system resilience
    return getMockResponse(title, description, category);
  }
};

/**
 * Handles interactive follow-up chat inside a case file
 */
const getChatReply = async (history, newMessage, complaintDetails) => {
  const disclaimerText = "\n\n**Disclaimer: This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions.**";
  
  if (useMock) {
    return "I understand your follow-up concern regarding this case. Please note that you may need to file an affidavit or request mediation. I suggest speaking to local legal aid services for direct advice." + disclaimerText;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `You are a helpful citizen legal guidance assistant. You help ordinary citizens understand their rights, laws, and legal procedures. 
      You are discussing a case file titled "${complaintDetails.title}" which is classified as "${complaintDetails.category}".
      The case details are: "${complaintDetails.description}".
      
      Strict Guidelines:
      1. Never provide binding legal advice.
      2. Always speak in a supportive but cautionary tone.
      3. Use non-definitive, non-conclusive language (e.g., "It appears...", "You might consider...", "This could fall under...").
      4. DO NOT append the disclaimer yourself if you're writing in the API, or do append it because the backend handles it. But to be safe, write standard conversational text.`
    });

    // Format history for Gemini API: [{ role: 'user'|'model', parts: [{ text: '' }] }]
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(newMessage);
    const replyText = result.response.text();
    
    // Ensure the disclaimer is always appended
    if (!replyText.includes("This platform provides informational guidance only")) {
      return replyText + disclaimerText;
    }
    return replyText;
  } catch (error) {
    console.error("Error in Gemini Chat follow-up:", error);
    return "I apologize, but I am having trouble connecting to my knowledge base right now. Please consult a legal professional for guidance." + disclaimerText;
  }
};

module.exports = {
  generateLegalGuidance,
  getChatReply
};
