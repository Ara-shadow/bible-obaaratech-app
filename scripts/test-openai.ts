import "dotenv/config";

console.log("AI_ENABLED:", process.env.AI_ENABLED);
console.log("AI_MODEL:", process.env.AI_MODEL);
console.log("AI_URL:", process.env.AI_API_URL);
console.log("KEY_PRESENT:", !!process.env.AI_API_KEY);
console.log("KEY_LENGTH:", process.env.AI_API_KEY?.length);

try {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
  });

  console.log("HTTP_STATUS:", response.status);
  console.log("RESPONSE:");
  console.log(await response.text());
} catch (error) {
  console.error("FETCH_ERROR:");
  console.error(error);
}
