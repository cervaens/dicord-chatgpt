const { Configuration, OpenAIApi } = require("openai");
const cosineSimilarity = require("compute-cosine-similarity");

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const QAs = [
  {
    Question: "What is Add3",
    Answer:
      "Its a powerful Token Management at Your Fingertips. It allows you to deploy customizable and compliant token products in minutes.",
  },
  {
    Question: "Who owns Add3",
    Answer: "Valentino",
  },
  {
    Question: "What are Add3 advantages?",
    Answer:
      "Add3 frees up engineering time. Your teams can now commit resources to creating your product. Go-to-market faster with Add3's ability to tackle development tasks quickly to complete your product.",
  },
  {
    Question: "What is Add3 website?",
    Answer: "add3.io",
  },
  {
    Question: "How much do I pay for Add3?",
    Answer: "Its free for the moment.",
  },
];

const createEmbedding = async (userQuery) => {
  let embeddingResult = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: [userQuery].concat(QAs.map((elem) => elem.Question)),
  });

  let embeddings = embeddingResult.data.data.map((entry) => entry.embedding);
  let userEmbedding = embeddings[0];
  embeddings = embeddings.slice(1);

  let questions = QAs.map((row, i) => {
    return {
      question: row.Question,
      answer: row.Answer,
      embedding: embeddings[i],
    };
  });

  let ranked = [];

  for (let i = 0; i < questions.length; i += 1) {
    let question = questions[i];
    let similarity = cosineSimilarity(question.embedding, userEmbedding);
    ranked.push({
      question: question.question,
      answer: question.answer,
      similarity,
    });
  }

  ranked = ranked.sort((questionA, questionB) => {
    return questionA.similarity > questionB.similarity ? -1 : 1;
  });

  let top3 = ranked.slice(0, 3);
  return top3;
};

const getAnswerForMessage = async (userQuery, top3) => {
  let prompt = [
    `You are a support bot in a Discord server. Your goal is to be chipper, cheerful and helpful.`,
    `It has been determined that the user is asking you a serious technical support question.`,
    `You have queried our database and found the three most relevant support questions and answers:`,
    ``,
    top3
      .map((question) => {
        return [
          `User: ${question.question}`,
          `You: ${question.answer}`,
          ``,
        ].join(`\n`);
      })
      .join(`\n`),
    `Now the user is asking a unique question we haven't seen before.`,
    `Using the above reference material, craft them the best answer you can.`,
    `If you don't think the above references give a good answer, simply tell the user you don't know how to help them.`,
    ``,
    `User: ${userQuery}`,
    `You:`,
  ].join("\n");

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: [`${prompt}`],
    max_tokens: 512,
    temperature: 0.5,
    top_p: 1,
    n: 1,
    echo: false,
    presence_penalty: 0,
    frequency_penalty: 0,
    best_of: 1,
  });
  return completion.data.choices[0].text;
};

module.exports = { createEmbedding, getAnswerForMessage };
