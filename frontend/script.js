document.addEventListener('DOMContentLoaded', () => {
  const domainFile = document.getElementById('domainFile');
  const uploadDomainBtn = document.getElementById('uploadDomainBtn');
  const userInput = document.getElementById('userInput');
  const generateBtn = document.getElementById('generateBtn');
  const testCaseOutput = document.getElementById('testCaseOutput');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');

  uploadDomainBtn.addEventListener('click', async () => {
    const file = domainFile.files[0];
    if (!file) {
      errorDiv.textContent = "Please select a domain knowledge file to upload.";
      errorDiv.style.display = 'block';
      return;
    }

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileContent = e.target.result;

      try {
        const response = await fetch('/upload-domain-knowledge', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ knowledge: fileContent }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        alert(result.message);

      } catch (error) {
        console.error('Error:', error);
        errorDiv.textContent = `Failed to upload domain knowledge: ${error.message}`;
        errorDiv.style.display = 'block';
      } finally {
        loadingDiv.style.display = 'none';
      }
    };

    reader.readAsText(file);
  });

  generateBtn.addEventListener('click', async () => {
    const textContent = userInput.value.trim();

    if (!textContent) {
      errorDiv.textContent = "Please enter a user story or bug report.";
      errorDiv.style.display = 'block';
      return;
    }

    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    testCaseOutput.innerHTML = '';

    const inputData = { userStory: textContent };

    try {
      const response = await fetch('/generate-test-cases', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(inputData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      displayTestCases(result.testCases);

    } catch (error) {
      console.error('Error:', error);
      errorDiv.textContent = `Failed to generate test cases: ${error.message}`;
      errorDiv.style.display = 'block';
    } finally {
      loadingDiv.style.display = 'none';
    }
  });

  function displayTestCases(testCases) {
    testCaseOutput.innerHTML = testCases;
  }
});
