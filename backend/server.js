const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

const OLLAMA_LLM_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3';

let domainKnowledgeStore = ''; // Stores uploaded domain knowledge

async function callLLM(prompt) {
  try {
    const response = await fetch(OLLAMA_LLM_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 1000 }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.response;

  } catch (error) {
    console.error('Error calling LLM:', error);
    throw new Error('Failed to get response from LLM.');
  }
}

// --- Endpoint to upload domain knowledge ---
app.post('/upload-domain-knowledge', (req, res) => {
  const { knowledge } = req.body;

  if (!knowledge) {
    return res.status(400).json({ error: 'No domain knowledge provided.' });
  }

  domainKnowledgeStore = knowledge;
  console.log("Domain Knowledge Updated");
  res.json({ message: 'Domain knowledge uploaded successfully.' });
});

// --- Endpoint to generate test cases ---
app.post('/generate-test-cases', async (req, res) => {
  const { userStory } = req.body;

  if (!userStory) {
    return res.status(400).json({ error: 'No user story provided.' });
  }

  if (!domainKnowledgeStore) {
    return res.status(400).json({ error: 'Domain knowledge is not uploaded yet.' });
  }

  const prompt = `
You are a Senior QA Engineer specialised in healthcare applications testing.

### Objective:
Using the provided domain knowledge, generate detailed manual test cases for the given User Story or Bug Report.

### Instructions:
- Generate multiple structured test cases covering positive, negative, and boundary scenarios wherever applicable.
- Use only the information from the domain knowledge to stay contextually relevant to healthcare processes.
- If required information is missing, note "Preconditions: Information not available in provided domain knowledge".

### Output Format:
\`\`\`
Test Case ID: <ID>
Description: <description>
Preconditions: <preconditions>
Test Steps:
1. <step one>
2. <step two>
...
Expected Result: <expected result>
\`\`\`

### Domain Knowledge:
${domainKnowledgeStore}

### User Story or Bug Report:
${userStory}

### Generated Test Cases:
`;

  try {
    const llmResponse = await callLLM(prompt);
    console.log("Generated Test Cases:", llmResponse);

    res.json({ testCases: llmResponse });
  } catch (error) {
    console.error('Error generating test cases:', error);
    res.status(500).json({ error: 'Failed to generate test cases. Please try again.' });
  }
});

// --- Serve UI ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Healthcare Test Case server running at http://localhost:${PORT}`);
});
