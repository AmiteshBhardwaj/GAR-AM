export const FIXED_TEST_QUESTIONS = [
  {
    question: "What is the primary function of the Program Counter (PC) in a CPU?",
    options: {
      A: "Stores the address of the next instruction to be fetched",
      B: "Performs arithmetic and logic operations",
      C: "Holds the currently executing instruction data",
      D: "Manages power distribution to processor cores"
    },
    correctAnswer: "A"
  },
  {
    question: "Which data structure operates strictly on a Last-In, First-Out (LIFO) principle?",
    options: {
      A: "Queue",
      B: "Stack",
      C: "Binary Search Tree",
      D: "Linked List"
    },
    correctAnswer: "B"
  },
  {
    question: "What is the average time complexity of searching an element in a balanced Binary Search Tree?",
    options: {
      A: "O(1)",
      B: "O(n)",
      C: "O(log n)",
      D: "O(n log n)"
    },
    correctAnswer: "C"
  },
  {
    question: "In relational database systems, what does the ACID acronym stand for?",
    options: {
      A: "Atomicity, Consistency, Isolation, Durability",
      B: "Accuracy, Concurrency, Integrity, Distribution",
      C: "Allocation, Control, Indexing, Data",
      D: "Authentication, Compression, Iteration, Deletion"
    },
    correctAnswer: "A"
  },
  {
    question: "Which layer of the OSI model is responsible for end-to-end communication and port addressing?",
    options: {
      A: "Data Link Layer",
      B: "Network Layer",
      C: "Transport Layer",
      D: "Session Layer"
    },
    correctAnswer: "C"
  },
  {
    question: "What mechanism allows multiple processes to share CPU time by saving and restoring state?",
    options: {
      A: "Context Switching",
      B: "Memory Paging",
      C: "Deadlock Detection",
      D: "Garbage Collection"
    },
    correctAnswer: "A"
  },
  {
    question: "In cryptography, what type of encryption uses a public key for encryption and a private key for decryption?",
    options: {
      A: "Symmetric Encryption",
      B: "Asymmetric Encryption",
      C: "One-Way Hashing",
      D: "Stream Cipher"
    },
    correctAnswer: "B"
  },
  {
    question: "Which CPU cache level is closest to the processor execution core and operates with the lowest latency?",
    options: {
      A: "L3 Cache",
      B: "L2 Cache",
      C: "L1 Cache",
      D: "Main RAM"
    },
    correctAnswer: "C"
  },
  {
    question: "What type of hazard in a CPU pipeline occurs when an instruction depends on the result of a previous instruction?",
    options: {
      A: "Structural Hazard",
      B: "Data Hazard",
      C: "Control Hazard",
      D: "Branch Hazard"
    },
    correctAnswer: "B"
  },
  {
    question: "Which HTTP status code signifies that a resource was successfully created on the server?",
    options: {
      A: "200 OK",
      B: "201 Created",
      C: "204 No Content",
      D: "301 Moved Permanently"
    },
    correctAnswer: "B"
  },
  {
    question: "In Git, which command creates a new branch and immediately switches to it in one action?",
    options: {
      A: "git branch -n <branch>",
      B: "git checkout -b <branch>",
      C: "git commit -m <branch>",
      D: "git merge <branch>"
    },
    correctAnswer: "B"
  },
  {
    question: "What is the primary purpose of virtual memory paging in modern operating systems?",
    options: {
      A: "Enables processes to access isolated virtual address space and utilize secondary storage as RAM",
      B: "Increases CPU clock frequency dynamically",
      C: "Encrypts hard drive sectors automatically",
      D: "Replaces motherboard BIOS firmware"
    },
    correctAnswer: "A"
  }
];

export const DEFAULT_CS_QUESTIONS = FIXED_TEST_QUESTIONS;

const OPTION_KEYS = ["A", "B", "C", "D"];

export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeWhitespace = (value) => (
  String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
);

const cleanInlineText = (value) => (
  normalizeWhitespace(value)
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/^[\s:;,.|-]+|[\s:;,.|-]+$/g, "")
);

const prepareQuestionBankText = (text) => (
  normalizeWhitespace(text)
    .replace(/\[Page \d+\]/g, "\n")
    .replace(/\b(ANSWERS|ANSWER\s+KEY|SOLUTIONS?)\b/gi, "\n$1\n")
    .replace(/(?<![(,])\s+(?=(?:Q(?:uestion)?\s*)?\d{1,3}\s*[).:-]\s+\S)/g, "\n")
    .replace(/\s+(?=[a-dA-D]\)\s+)/g, "\n")
    .replace(/\s+(?=[a-dA-D]\.\s+)/g, "\n")
    .replace(/\s+(?=(?:Answer|Ans|Correct\s*Answer)\s*[:.-]?\s*[a-dA-D]\b)/gi, "\n")
);

const looksLikeBadOption = (value) => {
  const text = cleanInlineText(value);
  if (text.length < 1 || text.length > 220) return true;
  if (/^(page|chapter|unit)\s+\d+$/i.test(text)) return true;
  if (/^(a|b|c|d)$/i.test(text)) return true;
  if (/(?:^|\s)(?:q(?:uestion)?\s*)?\d{1,3}\s*[).:-]\s+\S/i.test(text)) return true;
  if (text.split(/\s+/).length > 7 && (text.match(/\d+/g) || []).length >= 3) return true;
  return false;
};

// Levenshtein distance calculations for deduplication
const getLevenshteinDistance = (s1, s2) => {
  if (s1.length < s2.length) {
    return getLevenshteinDistance(s2, s1);
  }
  if (s2.length === 0) {
    return s1.length;
  }
  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let currentRow = Array(s2.length + 1);
  for (let i = 0; i < s1.length; i++) {
    currentRow[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const insertCost = previousRow[j + 1] + 1;
      const deleteCost = currentRow[j] + 1;
      const substituteCost = previousRow[j] + (s1[i] === s2[j] ? 0 : 1);
      currentRow[j + 1] = Math.min(insertCost, deleteCost, substituteCost);
    }
    previousRow = [...currentRow];
  }
  return previousRow[s2.length];
};

const getStringSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  const distance = getLevenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
};

// Pairwise deduplication with >80% similarity threshold
export const deduplicateQuestions = (questions) => {
  const uniqueQuestions = [];
  for (const q of questions) {
    let isDuplicate = false;
    for (const existing of uniqueQuestions) {
      const similarity = getStringSimilarity(q.question, existing.question);
      if (similarity > 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      uniqueQuestions.push(q);
    }
  }
  return uniqueQuestions;
};

const validateQuestion = (question) => {
  if (!question || typeof question !== "object") return null;

  const options = question.options || {};
  const cleanOptions = OPTION_KEYS.reduce((acc, key) => {
    acc[key] = cleanInlineText(options[key]);
    return acc;
  }, {});

  const optionValues = OPTION_KEYS.map(key => cleanOptions[key]);
  const uniqueOptions = new Set(optionValues.map(value => value.toLowerCase()));

  const questionText = cleanInlineText(question.question);

  if (
    questionText.length < 8 ||
    !OPTION_KEYS.includes(question.correctAnswer) ||
    optionValues.some(looksLikeBadOption) ||
    uniqueOptions.size !== 4
  ) {
    return null;
  }

  return {
    question: questionText,
    options: cleanOptions,
    correctAnswer: question.correctAnswer,
  };
};

const validateQuestions = (questions) => (
  questions
    .map(validateQuestion)
    .filter(Boolean)
);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const generateQuestions = async (text, apiKey = null) => {
  await delay(2000); // 2 second delay between calls
  const cleanText = normalizeWhitespace(text);
  const extractedMCQs = extractMCQsRobustly(cleanText);

  let rawPool = [];
  if (extractedMCQs.length > 0) {
    console.log(`Using ${extractedMCQs.length} extracted MCQs from the PDF/question bank.`);
    rawPool = extractedMCQs;
  } else {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || apiKey;

    if (!API_KEY) {
      throw new Error(
        'Gemini API key not found. ' +
        'Add VITE_GEMINI_API_KEY to .env.local'
      );
    }

    try {
      const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      const sourceExcerpt = cleanText; // Full text with no page limit or truncation

      const prompt = `You are generating revision quiz questions from the user's uploaded PDF/notes.

Extract ALL questions you can find in this text, maximum questions you can. Return every question present in the document, do not summarize or reduce them.

Rules:
- Use only the supplied PDF/notes content. Do not invent facts outside it.
- Cover the full document, not only the first page. Spread questions across all major topics and sections.
- If the source is already a question bank with options, preserve those questions where clear and use their original correct answers when available.
- If the source is theory notes, create conceptual and application-style questions from important definitions, formulas, contrasts, steps, and examples.
- Every option must be plausible, short, and distinct.
- Do not use random isolated words as options.
- Do not include page labels, headers, footers, answer-key lines, or metadata as questions/options.
- Return valid JSON only.

Required JSON shape:
[
  {
    "question": "string",
    "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
    "correctAnswer": "A"
  }
]

PDF/notes content:
${sourceExcerpt}`;

      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
              responseSchema: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    question: { type: "STRING" },
                    options: {
                      type: "OBJECT",
                      properties: {
                        A: { type: "STRING" },
                        B: { type: "STRING" },
                        C: { type: "STRING" },
                        D: { type: "STRING" },
                      },
                      required: ["A", "B", "C", "D"],
                    },
                    correctAnswer: {
                      type: "STRING",
                      enum: ["A", "B", "C", "D"],
                    },
                  },
                  required: ["question", "options", "correctAnswer"],
                },
              },
            },
          }),
        });
      } catch (fetchErr) {
        console.warn("Gemini fetch failed. Error:", fetchErr);
        throw new Error("Gemini could not be reached. No reliable local MCQs were found in the PDF.", { cause: fetchErr });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API returned status ${response.status}: ${errData?.error?.message || "Unknown error"}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Gemini did not return any question content.");
      }

      const parsedQuestions = JSON.parse(generatedText);
      rawPool = Array.isArray(parsedQuestions)
        ? validateQuestions(parsedQuestions)
        : [];

      if (rawPool.length === 0) {
        throw new Error("Gemini returned no valid questions from the PDF content.");
      }
    } catch (error) {
      console.error("Error in AI generation path:", error);
      throw new Error(error.message || "Question generation failed.", { cause: error });
    }
  }

  // Pairwise deduplicate pool before returning
  const deduplicatedPool = deduplicateQuestions(rawPool);
  console.log(`[AI GENERATOR POOL] Extracted: ${rawPool.length}, Unique after deduplication: ${deduplicatedPool.length}`);
  return deduplicatedPool;
};

const getQuestionNumber = (text) => {
  const match = text.match(/(?:^|\s)(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:-]/i);
  return match ? parseInt(match[1], 10) : null;
};

export const extractMCQsRobustly = (text) => {
  const cleanText = prepareQuestionBankText(text);
  const lines = cleanText
    .split(/\n+/)
    .map(cleanInlineText)
    .filter(Boolean);

  const questions = [];
  let current = null;
  let activeOption = null;
  let inAnswerSection = false;
  let groupStartIndex = 0;

  const optionLineRegex = /^(?:option\s*)?[([]?([a-dA-D])[\]).:-]\s+(.+)$/;
  const questionLineRegex = /^(?:(?:q(?:uestion)?\s*)?\d{1,3}[).:-]\s+|Q\d{1,3}\s+)(.+)$/i;
  const answerLineRegex = /^(?:answer|ans|correct\s*answer)\s*[:.-]?\s*[([]?([a-dA-D])[\])]?/i;

  const pushCurrent = () => {
    if (!current) return;

    const normalized = validateQuestion({
      question: current.questionParts.join(" "),
      options: current.options,
      correctAnswer: current.correctAnswer || "A",
    });

    if (normalized) {
      questions.push(normalized);
    }
  };

  const applyAnswer = (questionNumber, letter) => {
    const targetQuestion = questions[groupStartIndex + questionNumber - 1];
    if (targetQuestion) {
      targetQuestion.correctAnswer = letter.toUpperCase();
    }
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (/^(?:case\s+study|real\s+numbers|polynomials|linear\s+equations)/i.test(line)) {
      pushCurrent();
      current = null;
      activeOption = null;
      inAnswerSection = false;
      groupStartIndex = questions.length;
      continue;
    }

    if (/^(answers|answer\s+key|solutions?)$/i.test(line)) {
      inAnswerSection = true;
      pushCurrent();
      current = null;
      activeOption = null;
      continue;
    }

    const answerPairMatch = line.match(/^(?:q(?:uestion)?\s*)?(\d{1,3})\s*[).:-]?\s*[([]?([a-dA-D])[\]).:-]?/i);
    const splitAnswerMatch = line.match(/^(\d{1,3})$/);
    const nextAnswerLineMatch = lines[lineIndex + 1]?.match(/^([a-dA-D])[\]).:-]?\s*(.*)$/);

    if ((inAnswerSection && answerPairMatch) || (splitAnswerMatch && nextAnswerLineMatch && questions.length > groupStartIndex)) {
      pushCurrent();
      current = null;
      activeOption = null;

      if (answerPairMatch && inAnswerSection) {
        applyAnswer(parseInt(answerPairMatch[1], 10), answerPairMatch[2]);
      } else {
        applyAnswer(parseInt(splitAnswerMatch[1], 10), nextAnswerLineMatch[1]);
        lineIndex += 1;
      }

      continue;
    }

    const answerMatch = line.match(answerLineRegex);
    if (answerMatch && current) {
      current.correctAnswer = answerMatch[1].toUpperCase();
      activeOption = null;
      continue;
    }

    const optionMatch = line.match(optionLineRegex);
    if (optionMatch && current) {
      activeOption = optionMatch[1].toUpperCase();
      current.options[activeOption] = cleanInlineText(optionMatch[2]);
      continue;
    }

    const questionMatch = line.match(questionLineRegex);
    const startsNewQuestion = questionMatch || (/\?$/.test(line) && Object.keys(current?.options || {}).length >= 3);

    if (startsNewQuestion) {
      pushCurrent();
      current = {
        number: getQuestionNumber(line),
        questionParts: [cleanInlineText(questionMatch ? questionMatch[1] : line)],
        options: {},
        correctAnswer: null,
      };
      activeOption = null;
      continue;
    }

    if (!current && /\?$/.test(line)) {
      current = {
        number: getQuestionNumber(line),
        questionParts: [line],
        options: {},
        correctAnswer: null,
      };
      activeOption = null;
      continue;
    }

    if (current && activeOption && Object.keys(current.options).length < 4) {
      current.options[activeOption] = cleanInlineText(`${current.options[activeOption]} ${line}`);
      continue;
    }

    if (current && Object.keys(current.options).length >= 4) {
      pushCurrent();
      current = null;
      activeOption = null;
    }

    if (current && Object.keys(current.options).length === 0) {
      current.questionParts.push(line);
    }
  }

  pushCurrent();

  const seen = new Set();
  return questions.filter(question => {
    const key = question.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const parseMCQQuestions = (text) => extractMCQsRobustly(text);

export const generateMockQuestions = (text) => {
  const cleanText = normalizeWhitespace(text);
  if (!cleanText || cleanText.length < 80) {
    throw new Error("Notes text content is too short to generate questions.");
  }

  const extractedMCQs = extractMCQsRobustly(cleanText);

  if (extractedMCQs.length > 0) {
    const deduplicated = deduplicateQuestions(extractedMCQs);
    return deduplicated;
  }

  throw new Error("No complete MCQs were found in the notes text. Local generation is disabled to avoid random questions and options.");
};
