const { genAI } = require('../config/gemini');

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

const getFallbackGuidance = (title, description, category, state, district) => {
  return {
    summary: `Informational overview: A grievance has been reported regarding "${title}" under the category "${category || 'General'}" in ${district}, ${state}. Description: "${description.substring(0, 100)}..."`,
    classification: category || "General Dispute",
    applicableLaws: [
      {
        law: "Relevant Local and Central Regulations",
        description: "Depending on the exact nature of the dispute, standard civil, consumer, or penal codes may apply. For example, the Consumer Protection Act, 2019 or relevant provisions of the Indian Penal Code/Bharatiya Nyaya Sanhita."
      },
      {
        law: "Code of Civil Procedure / Code of Criminal Procedure",
        description: "Governs the procedural aspects of filing petitions, complaints, or suits before the appropriate judicial authority."
      }
    ],
    suggestedAuthority: "Local District Court, Consumer Forum, or Police Station depending on nature of the dispute.",
    requiredDocuments: [
      "Copy of the written complaint or grievance document.",
      "Any supporting evidence (receipts, chat histories, emails, photos).",
      "Government-issued identity proof (Aadhaar Card, PAN, or Passport).",
      "Representational agreements or notices sent to the opposing party, if any."
    ],
    stepByStepProcedure: [
      "Gather and organize all relevant documents and evidence related to the grievance.",
      "Draft a formal complaint outlining the facts, dates, and specific relief sought.",
      "Submit the complaint to the relevant authority or register it online via the appropriate portal.",
      "Keep track of the acknowledgement number or diary number for future reference.",
      "Consult a legal professional or legal aid clinic to determine the next formal steps."
    ],
    nextActions: [
      "Review all supporting files and compile a timeline of events.",
      "Consult a local lawyer or free legal aid service for professional counsel."
    ],
    preventiveTips: [
      "Always keep written records of communications and transactions.",
      "Read all terms, conditions, and contracts thoroughly before signing.",
      "Verify the credentials of any third-party services or vendors."
    ],
    faqs: [
      {
        question: "Is this automated analysis legally binding?",
        answer: "No. This guidance is purely informational. Only official court orders or signed settlement agreements are legally binding."
      },
      {
        question: "What is my next immediate step?",
        answer: "You should seek a legal consultation with an advocate or approach the local legal services authority for official representation."
      }
    ],
    disclaimer: "This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions."
  };
};

/**
 * Generates initial legal guidance analysis for a citizen's complaint
 */
const generateLegalGuidance = async (title, description, category, state, district) => {
  if (!genAI) {
    console.log("Using offline mock fallback legal guidance.");
    return getFallbackGuidance(title, description, category, state, district);
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
    console.error("Gemini API Error during guidance generation:", error);
    console.warn("Falling back to structured offline legal guidance.");
    return getFallbackGuidance(title, description, category, state, district);
  }
};

/**
 * Handles interactive follow-up chat inside a case file
 */
const getChatReply = async (history, newMessage, complaintDetails) => {
  const disclaimerText = "\n\n**Disclaimer: This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions.**";
  
  if (!genAI) {
    console.log("Using offline mock chat reply.");
    return "Thank you for your message. Since Gemini API is currently offline/not configured, I am unable to process live legal queries. However, you can proceed by checking your local district courts or legal aid cells for direct consultation." + disclaimerText;
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
    console.error("Gemini API Error during follow-up chat:", error);
    return "I apologize, but I am currently unable to reach my legal databases. Please consult a licensed professional." + disclaimerText;
  }
};

/**
 * Translates a structured legal guidance JSON report to a target language
 */
const translateReport = async (reportData, targetLanguage) => {
  if (!genAI) {
    console.log(`Offline: Skipping translation. Returning original English report.`);
    return reportData;
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
      You are an expert legal translator. Translate the following legal guidance JSON report from English to the target language: "${targetLanguage}".
      
      Strict Rules:
      1. Translate only the textual content of the values inside the JSON (including items in arrays).
      2. Do NOT translate JSON keys (keep "summary", "applicableLaws", "law", "description", "suggestedAuthority", "requiredDocuments", "stepByStepProcedure", "nextActions", "preventiveTips", "faqs", "question", "answer", "disclaimer" exactly as they are).
      3. The translated content must preserve the exact same meaning, caution, non-binding tone, and layout.
      4. Return the result strictly in the JSON format matching the schema.
      
      JSON REPORT DATA TO TRANSLATE:
      ${JSON.stringify(reportData, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Gemini API Error during report translation:", error);
    throw error;
  }
};

module.exports = {
  generateLegalGuidance,
  getChatReply,
  translateReport
};
