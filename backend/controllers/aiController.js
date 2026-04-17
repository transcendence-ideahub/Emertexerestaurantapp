import catchAsync from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";

export const generateDescription = catchAsync(async (req, res, next) => {
  const { itemName, dishType } = req.body;

  if (!itemName) {
    return next(new ErrorHandler("Please provide an item name", 400));
  }

  const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
    return next(new ErrorHandler("AI API Key not found", 500));
  }

  const prompt = `Write a professional, appetizing, and concise Swiggy-style description (max 30 words) for a food item named "${itemName}" which is ${dishType}. Make it sound delicious!`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    const data = await response.json();
    const description = data.choices[0].message.content.trim().replace(/^"|"$/g, '');

    res.status(200).json({
      success: true,
      description
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to generate AI description", 500));
  }
});
