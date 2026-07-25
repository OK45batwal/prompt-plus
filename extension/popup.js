document.getElementById("enhance-btn").addEventListener("click", () => {
  const input = document.getElementById("quick-input").value.trim();
  if (!input) return;

  const outputBox = document.getElementById("output");
  outputBox.style.display = "block";
  outputBox.innerText = "Enhancing prompt...";

  const enhanced = `### Role & Objective
You are an expert AI assistant. Fulfill the user's instructions with maximum precision and structured clarity.

### Task Input
${input}

### Key Instructions
1. Provide a step-by-step well-reasoned response.
2. Structure the output with clean Markdown headers and code blocks.
3. Eliminate filler text and ensure production-ready quality.`;

  outputBox.innerText = enhanced;
  navigator.clipboard.writeText(enhanced);
  alert("Enhanced prompt copied to clipboard!");
});
