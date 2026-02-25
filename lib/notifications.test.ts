import { describe, expect, test } from "bun:test";
import {
  buildChallengeCard,
  type ChallengeNotificationData,
} from "./notifications";

const baseData: ChallengeNotificationData = {
  challengerName: "Mario",
  challengedName: "Luigi",
  challengerElo: 1350,
  challengedElo: 1280,
  message: "Let's settle this on the court!",
};

describe("buildChallengeCard", () => {
  test("returns valid adaptive card structure", () => {
    const card = buildChallengeCard(baseData);
    expect(card.type).toBe("message");
    expect(card.attachments).toHaveLength(1);
    expect(card.attachments[0].contentType).toBe(
      "application/vnd.microsoft.card.adaptive"
    );
    expect(card.attachments[0].content.type).toBe("AdaptiveCard");
  });

  test("includes player names in columns", () => {
    const card = buildChallengeCard(baseData);
    const json = JSON.stringify(card);
    expect(json).toContain("Mario");
    expect(json).toContain("Luigi");
  });

  test("includes Elo ratings", () => {
    const card = buildChallengeCard(baseData);
    const json = JSON.stringify(card);
    expect(json).toContain("Elo 1350");
    expect(json).toContain("Elo 1280");
  });

  test("includes message when present", () => {
    const card = buildChallengeCard(baseData);
    const json = JSON.stringify(card);
    expect(json).toContain("Let's settle this on the court!");
  });

  test("omits message block when null", () => {
    const card = buildChallengeCard({ ...baseData, message: null });
    const body = card.attachments[0].content.body;
    // Title + ColumnSet only, no message TextBlock
    expect(body).toHaveLength(2);
  });

  test("includes message block when present (3 body items)", () => {
    const card = buildChallengeCard(baseData);
    const body = card.attachments[0].content.body;
    expect(body).toHaveLength(3);
  });
});
