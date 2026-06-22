import { describe, expect, it } from "vitest";

import {
  getCategoryVariant,
  MARKET_UPDATES_OPTION,
  NEWS_OPTION,
  TECHNICAL_OPTION,
  INVESTMENT_OPTION,
  INVESTOR_RELATIONS_OPTION,
  FUND_DOCUMENTS_OPTION,
  PRODUCT_OPTION,
} from "../src/pages/community/logic";

// Guards the content-aware community categorization. Each post must land in the
// correct bucket based on its actual content — not the messy backend `category`.
describe("community category classifier", () => {
  const cases: Array<{ post: Record<string, unknown>; expected: string }> = [
    // Technical (the maintainer's example — was wrongly "Market Updates")
    {
      post: {
        title: "How Applications Connect to OpenAI's Large Language Models",
        description: "A breakdown of the three-layer architecture and API gateway.",
        category: "market updates",
        slug: "market/openai-llm",
      },
      expected: TECHNICAL_OPTION,
    },
    {
      post: { title: "Minimalist API Design and the Emerging AI Agent Ecosystem", category: "general", slug: "general/minimalist-api" },
      expected: TECHNICAL_OPTION,
    },
    // News (was wrongly "Market Updates")
    {
      post: {
        title: "UAE's Minister of Foreign Trade: A Profile of Dr. Thani bin Ahmed Al Zeyoudi",
        category: "market updates",
        slug: "market/uae-minister",
      },
      expected: NEWS_OPTION,
    },
    {
      post: { title: "Market Wrap: Tariff Turbulence Trips Stocks", category: "market updates", slug: "market-updates/march-3-2025" },
      expected: NEWS_OPTION,
    },
    // Genuine market updates stay Market Updates
    {
      post: { title: "Daily Market Update - 17th April", category: "market updates", slug: "daily-market-update/17-apr-2025" },
      expected: MARKET_UPDATES_OPTION,
    },
    // Fund Documents
    {
      post: { title: "Private Placement Memorandum", category: "fund documents", slug: "fund-documents/private-placement-memorandum" },
      expected: FUND_DOCUMENTS_OPTION,
    },
    // Investor Relations
    {
      post: { title: "Q1 2025 Investment Perspectives – Letter to Fund A Partners", category: "investor relations & strategies", slug: "news/investment-perspective" },
      expected: INVESTOR_RELATIONS_OPTION,
    },
    // Product
    {
      post: { title: "Product Update - Hushh Wallet", category: "product updates", slug: "product/hushh-wallet" },
      expected: PRODUCT_OPTION,
    },
    // Investment
    {
      post: { title: "Sell the Wall", description: "A systematic approach to capturing alpha through options selling.", category: "investment & financial strategies", slug: "general/sell-the-wall-featured" },
      expected: INVESTMENT_OPTION,
    },
  ];

  for (const { post, expected } of cases) {
    it(`classifies "${String(post.title)}" as ${expected}`, () => {
      expect(getCategoryVariant(post as never)).toBe(expected);
    });
  }
});
