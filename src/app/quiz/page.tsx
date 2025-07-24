import React, { useState } from "react";

const questions = [
  {
    q: "Did you buy any products from Brand X in the last 2 years?",
    a: ["Yes", "No"],
  },
  { q: "Have you used Service Z?", a: ["Yes", "No"] },
  { q: "Do you keep receipts for online purchases?", a: ["Yes", "No"] },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answer: string) => {
    if (answer === "Yes") setScore(score + 1);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  return (
    <main className="max-w-md mx-auto pt-8 pb-20 px-4 flex flex-col items-center">
      {!showResult ? (
        <div className="w-full">
          <h1 className="text-xl font-bold mb-6 text-center">
            Missed Money Quiz
          </h1>
          <div className="bg-white rounded-xl shadow p-6 mb-4">
            <p className="text-lg font-medium mb-6">{questions[step].q}</p>
            <div className="flex gap-4 justify-center">
              {questions[step].a.map((a) => (
                <button
                  key={a}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-semibold text-lg hover:bg-blue-700 transition"
                  onClick={() => handleAnswer(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === step ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">You missed out on</h2>
          <div className="text-5xl font-extrabold text-green-600 animate-bounce mb-2">
            ${score * 125}
          </div>
          <p className="text-lg text-gray-700 mb-6">in class action claims!</p>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold text-lg hover:bg-blue-700 transition"
            onClick={() => {
              setStep(0);
              setScore(0);
              setShowResult(false);
            }}
          >
            Retake Quiz
          </button>
        </div>
      )}
    </main>
  );
}
