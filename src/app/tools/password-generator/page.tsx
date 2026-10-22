import type { Metadata } from "next";
import { ToolLayout } from "@/components/shared/ToolLayout";
import { PasswordGeneratorTool } from "@/modules/password/PasswordGeneratorTool";

export const metadata: Metadata = {
  title: "Password Generator – Secure Random Password Generator Online | Utilby",
  description:
    "Generate strong, cryptographically secure random passwords client-side with customizable length, symbols, and Shannon entropy meter. 100% private.",
  keywords: [
    "password generator",
    "random password generator",
    "secure password generator",
    "strong password generator",
    "generate passwords online",
    "entropy password meter",
  ],
  alternates: {
    canonical: "/tools/password-generator",
  },
};

export default function PasswordGeneratorPage() {
  const howToSteps = [
    {
      step: "1",
      title: "Set Password Length",
      description:
        "Adjust the length slider between 6 and 64 characters. We recommend at least 16 characters for high resistance against brute-force attacks.",
    },
    {
      step: "2",
      title: "Customize Character Rules",
      description:
        "Select or deselect uppercase, lowercase, numbers, and special symbols. Enable 'Exclude Confusing Characters' to avoid confusing letters like '1' and 'l'.",
    },
    {
      step: "3",
      title: "Check Strength & Copy",
      description:
        "Observe the real-time entropy score and strength rating. Click 'Copy' to store your new secure password directly to your clipboard.",
    },
    {
      step: "4",
      title: "Batch Generation (Optional)",
      description:
        "Need passwords for multiple accounts or users? Choose 3, 5, or 10 to generate a whole batch at once.",
    },
  ];

  const technicalDetails = {
    title: "Cryptographic Randomness & Entropy Standards",
    content: (
      <>
        <p>
          Not all random generators are secure. Standard <code>Math.random()</code> in JavaScript produces pseudo-random numbers that can be predicted by statistical modeling.
        </p>
        <p>
          <strong>CSPRNG Implementation:</strong> This tool strictly uses <code>window.crypto.getRandomValues()</code>, drawing entropy directly from your operating system&apos;s kernel CSPRNG (hardware entropy collector, thermal noise, and hardware interrupts).
        </p>
        <p>
          <strong>Shannon Entropy:</strong> Password strength is measured in bits of entropy:
          <br />
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">
            Entropy = Length × log₂(Character Pool Size)
          </code>
          <br />
          A 16-character password using letters, numbers, and symbols delivers over 100 bits of entropy, which would take classical computers billions of years to crack.
        </p>
      </>
    ),
  };

  const faqs = [
    {
      question: "Are generated passwords saved, sent to a server, or logged?",
      answer:
        "Never. All password generation happens entirely inside your device's browser memory via native Web Cryptography APIs. No passwords, network requests, or analytics telemetry are ever recorded.",
    },
    {
      question: "What is the recommended password length for modern security?",
      answer:
        "Leading cybersecurity authorities (such as NIST and CISA) recommend a minimum of 16 characters with a diverse mix of uppercase letters, lowercase letters, numbers, and symbols.",
    },
    {
      question: "What does 'Exclude Confusing Characters' do?",
      answer:
        "It removes ambiguous characters such as uppercase 'I', lowercase 'l', number '1', uppercase 'O', number '0', and brackets. This prevents transcription mistakes when you need to read or type passwords manually on mobile keyboards.",
    },
  ];

  return (
    <ToolLayout
      toolId="password-generator"
      title="Secure Random Password Generator"
      subtitle="Create ultra-strong, cryptographically secure random passwords with customizable length, symbols, and entropy strength score."
      category="Security Tools"
      categorySlug="security"
      howToSteps={howToSteps}
      technicalDetails={technicalDetails}
      faqs={faqs}
    >
      <PasswordGeneratorTool />
    </ToolLayout>
  );
}
