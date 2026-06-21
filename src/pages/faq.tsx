import React from "react";
import {
  Box,
  Container,
  Heading,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

import HushhTechBackHeader from "../components/hushh-tech-back-header/HushhTechBackHeader";
import {
  appleDisplayFont,
  appleFont,
} from "../components/hushh-tech-ui/HushhAppleUI";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  eyebrow: string;
  title: string;
  items: FaqItem[];
}

const faqCategories: FaqCategory[] = [
  {
    eyebrow: "Fund A",
    title: "Fund Access and Terms",
    items: [
      {
        question: "What is Hushh Fund A?",
        answer:
          "Hushh Fund A is our flagship AI-assisted, multi-strategy investment fund built around disciplined portfolio construction, options income, and long-term value creation.",
      },
      {
        question: "What is the minimum investment?",
        answer:
          "The minimum commitment is $1 million for eligible investors. Final eligibility and class terms are confirmed through the fund documents and investor review.",
      },
      {
        question: "How do I track my investment performance?",
        answer:
          "After onboarding and review, investors can use their profile to view key account status, fund updates, documents, and performance-related information as it becomes available.",
      },
      {
        question: "Is my investment liquid?",
        answer:
          "Fund A is designed for long-term investors. Liquidity is expected through quarterly redemption windows after the applicable lock-up and subject to the fund documents.",
      },
    ],
  },
  {
    eyebrow: "Strategy",
    title: "Investment Philosophy",
    items: [
      {
        question:
          "How does Hushh align investment strategy with long-term value creation?",
        answer:
          "We focus on durable businesses, disciplined risk controls, and repeatable investment processes. The goal is not to chase short-term market noise, but to compound capital through a structured, data-informed approach.",
      },
      {
        question:
          "How is Hushh different from a traditional investment firm?",
        answer:
          "Hushh combines AI-assisted research, human oversight, and a product-quality investor experience. The moat is the operating system around data, discipline, transparency, and speed of iteration.",
      },
      {
        question:
          "What does Hushh's human-first approach mean in practice?",
        answer:
          "It means investor clarity, privacy, and control remain central. Technology supports the decision process, but the experience is designed to be understandable, accountable, and aligned with long-term trust.",
      },
    ],
  },
  {
    eyebrow: "Risk",
    title: "Portfolio and Market Discipline",
    items: [
      {
        question: "What risk controls does Hushh use?",
        answer:
          "The strategy uses diversification, position sizing, eligibility review, liquidity rules, and portfolio monitoring to keep risk intentional rather than accidental.",
      },
      {
        question: "What types of assets does Hushh focus on?",
        answer:
          "The Fund A approach centers on high-quality public-market businesses, options income, volatility harvesting, and AI-assisted research signals. Exact exposure is governed by the fund documents.",
      },
      {
        question: "How does Hushh handle downturns or market corrections?",
        answer:
          "The strategy is built to respect market cycles. During stress periods, risk controls, liquidity discipline, and portfolio review matter more than chasing returns.",
      },
      {
        question: "Are returns guaranteed?",
        answer:
          "No. Investing carries risk, including possible loss of principal. Target returns are not guarantees, and investors should review the risk disclosures before committing capital.",
      },
    ],
  },
  {
    eyebrow: "Data",
    title: "AI, Privacy, and Security",
    items: [
      {
        question: "How does Hushh use AI?",
        answer:
          "AI supports research, signal processing, portfolio monitoring, and operational workflows. It does not replace investment judgment, review, or risk discipline.",
      },
      {
        question: "How is my data protected?",
        answer:
          "Hushh uses secure systems, consent-based data access, and limited internal access for review and compliance purposes. Personal and financial data is not treated as a marketing asset.",
      },
      {
        question: "Who can see my financial information?",
        answer:
          "Financial information is used for onboarding, verification, and investor review by authorized personnel and service providers supporting those workflows.",
      },
      {
        question: "What is the NDA for?",
        answer:
          "The NDA protects confidential investment materials, fund information, and private review content shared during the investor process.",
      },
    ],
  },
  {
    eyebrow: "Account",
    title: "Profile, Rewards, and Support",
    items: [
      {
        question: "What are Hushh Coins?",
        answer:
          "Hushh Coins are onboarding and engagement rewards that help explain progress and unlock future Hushh experiences. They are not investment returns or fund units.",
      },
      {
        question: "How do I update my profile?",
        answer:
          "Use the Profile tab to review your onboarding status, account details, documents, and next steps. Some submitted review details may require support help to change.",
      },
      {
        question: "Where do I get help?",
        answer:
          "Use the Support page or email support@hushh.ai with the page URL and a short description of the issue so the team can route it quickly.",
      },
    ],
  },
];

const FaqPage: React.FC = () => {
  const [openKey, setOpenKey] = React.useState<string | null>(null);

  const toggleAccordion = (key: string) => {
    setOpenKey((current) => (current === key ? null : key));
  };

  return (
    <Box
      bg="#F5F5F7"
      color="#1D1D1F"
      fontFamily={appleFont}
      minH="100vh"
      sx={{
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <HushhTechBackHeader showRightButton={false} />

      <Box as="main" id="main-content">
        <Container
          maxW="7xl"
          py={{ base: 10, md: 14, lg: 16 }}
          px={{ base: 4, sm: 6, lg: 8 }}
        >
          <Box textAlign="center" mb={{ base: 12, md: 14 }}>
            <Heading
              as="h1"
              fontFamily={appleDisplayFont}
              fontWeight="600"
              fontSize="clamp(32px, 4.6vw, 54px)"
              lineHeight="1.08"
              letterSpacing="-0.025em"
              color="#1D1D1F"
            >
              Frequently Asked Questions.
            </Heading>

            <Text
              fontSize="clamp(17px, 1.6vw, 20px)"
              fontWeight="400"
              maxW="46ch"
              mx="auto"
              color="rgba(0,0,0,0.62)"
              mt="20px"
              lineHeight="1.5"
              letterSpacing="-0.01em"
            >
              Clear answers about Fund A, investment risk, privacy, rewards, and
              investor support.
            </Text>
          </Box>

          <VStack
            spacing={{ base: 8, md: 10 }}
            align="stretch"
            maxW="5xl"
            mx="auto"
            w="100%"
            role="list"
          >
            {faqCategories.map((category, categoryIndex) => (
              <Box key={category.title} role="listitem">
                <Box
                  display={{ base: "block", md: "flex" }}
                  alignItems="end"
                  justifyContent="space-between"
                  mb={{ base: 4, md: 5 }}
                  px={{ base: 1, md: 2 }}
                >
                  <Box>
                    <Text
                      fontFamily={appleFont}
                      fontSize="12px"
                      fontWeight="700"
                      letterSpacing="0.18em"
                      textTransform="uppercase"
                      color="#0071E3"
                      mb={2}
                    >
                      {category.eyebrow}
                    </Text>
                    <Heading
                      as="h2"
                      fontFamily={appleDisplayFont}
                      fontSize={{ base: "1.45rem", md: "1.85rem" }}
                      fontWeight="600"
                      letterSpacing="-0.025em"
                      lineHeight="1.12"
                      color="#1D1D1F"
                    >
                      {category.title}
                    </Heading>
                  </Box>
                  <Text
                    mt={{ base: 2, md: 0 }}
                    fontSize="0.9rem"
                    color="rgba(0,0,0,0.42)"
                  >
                    {category.items.length} questions
                  </Text>
                </Box>

                <VStack spacing={{ base: 3, md: 4 }} align="stretch" role="list">
                  {category.items.map((faq, itemIndex) => {
                    const key = `${categoryIndex}-${itemIndex}`;
                    const isOpen = openKey === key;
                    const panelId = `faq-panel-${key}`;
                    const triggerId = `faq-trigger-${key}`;

                    return (
                      <Box
                        key={key}
                        role="listitem"
                        bg="whiteAlpha.800"
                        borderRadius="24px"
                        overflow="hidden"
                        borderWidth="1px"
                        borderColor="blackAlpha.100"
                        boxShadow={
                          isOpen
                            ? "0 18px 50px rgba(29,29,31,0.08)"
                            : "0 10px 32px rgba(29,29,31,0.05)"
                        }
                        transition="box-shadow 0.2s ease, border-color 0.2s ease"
                        _hover={{
                          borderColor: "rgba(0,102,204,0.24)",
                          boxShadow: "0 18px 48px rgba(29,29,31,0.08)",
                        }}
                      >
                        <Heading
                          as="h3"
                          m={0}
                          fontFamily={appleFont}
                          fontSize={{ base: "0.95rem", md: "1rem" }}
                          fontWeight="600"
                          lineHeight="snug"
                        >
                          <Box role="group" w="100%">
                            <Box
                              as="button"
                              type="button"
                              id={triggerId}
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              onClick={() => toggleAccordion(key)}
                              display="flex"
                              w="100%"
                              alignItems="flex-start"
                              justifyContent="space-between"
                              gap={4}
                              px={{ base: 5, md: 6 }}
                              py={{ base: 5, md: 6 }}
                              cursor="pointer"
                              border="none"
                              bg="transparent"
                              borderTopRadius="2xl"
                              textAlign="left"
                              font="inherit"
                              color="gray.900"
                              transition="background-color 0.2s ease, box-shadow 0.2s ease"
                              _hover={{
                                bg: "whiteAlpha.700",
                                boxShadow:
                                  "inset 0 0 0 1px rgba(0, 0, 0, 0.04)",
                              }}
                              _active={{ bg: "gray.100" }}
                              _focus={{ outline: "none" }}
                              _focusVisible={{
                                boxShadow:
                                  "inset 0 0 0 1px rgba(0, 0, 0, 0.04), 0 0 0 3px rgba(0, 113, 227, 0.28)",
                              }}
                            >
                              <Box
                                as="span"
                                display="block"
                                flex="1"
                                pr={1}
                                minW={0}
                                overflowWrap="anywhere"
                                wordBreak="normal"
                                transition="color 0.2s ease"
                                _groupHover={{ color: "black" }}
                              >
                                {faq.question}
                              </Box>
                              <Icon
                                as={isOpen ? ChevronUpIcon : ChevronDownIcon}
                                aria-hidden
                                w={5}
                                h={5}
                                mt={0.5}
                                flexShrink={0}
                                color="gray.400"
                                transition="color 0.2s ease, transform 0.2s ease"
                                _groupHover={{
                                  color: "gray.600",
                                  transform: isOpen
                                    ? "translateY(-1px)"
                                    : "translateY(2px)",
                                }}
                              />
                            </Box>
                          </Box>
                        </Heading>

                        {isOpen ? (
                          <Box
                            id={panelId}
                            role="region"
                            aria-labelledby={triggerId}
                            px={{ base: 5, md: 6 }}
                            pb={{ base: 5, md: 6 }}
                            pt={4}
                            borderTopWidth="1px"
                            borderTopColor="gray.100"
                            color="gray.600"
                            fontSize={{ base: "0.9375rem", md: "1rem" }}
                            fontWeight="400"
                            lineHeight="tall"
                          >
                            {faq.answer}
                          </Box>
                        ) : null}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default FaqPage;
