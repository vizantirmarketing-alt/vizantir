import { NextResponse } from "next/server";
import { carePricing, landingPagePricing, projectPricing } from "@/data/pricing";

function listItems(items: readonly string[]): string {
  return items.map((item) => `  - ${item}`).join("\n");
}

function buildPricingMarkdown(): string {
  const projectSections = projectPricing
    .map(
      (tier) => `### ${tier.name}

- Price: ${tier.price}
- Timeline: ${tier.timeline}
- Includes:
${listItems(tier.includes)}`,
    )
    .join("\n\n");

  const careSections = carePricing
    .map(
      (tier) => `### ${tier.name}

- Price: ${tier.price}
- Includes:
${listItems(tier.includes)}`,
    )
    .join("\n\n");

  const landingSections = landingPagePricing
    .map(
      (tier) => `### ${tier.name}

- Price: ${tier.price}
- Includes:
${listItems(tier.includes)}`,
    )
    .join("\n\n");

  return `# Pricing

## Website Projects

${projectSections}

## Care Plans

${careSections}

## Landing Pages

${landingSections}
`;
}

export function GET() {
  return new NextResponse(buildPricingMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
