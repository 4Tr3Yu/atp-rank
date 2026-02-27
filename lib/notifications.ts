export interface ChallengeNotificationData {
  challengerName: string;
  challengedName: string;
  challengerElo: number;
  challengedElo: number;
  message: string | null;
}

export function buildChallengeCard(data: ChallengeNotificationData) {
  const bodyItems = [
    {
      type: "TextBlock",
      text: "New Challenge!",
      weight: "Bolder",
      size: "Large",
    },
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: data.challengerName,
              weight: "Bolder",
              horizontalAlignment: "Center",
            },
            {
              type: "TextBlock",
              text: `Elo ${data.challengerElo}`,
              size: "Small",
              isSubtle: true,
              horizontalAlignment: "Center",
              spacing: "None",
            },
          ],
        },
        {
          type: "Column",
          width: "auto",
          verticalContentAlignment: "Center",
          items: [
            {
              type: "TextBlock",
              text: "vs",
              isSubtle: true,
              horizontalAlignment: "Center",
            },
          ],
        },
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: data.challengedName,
              weight: "Bolder",
              horizontalAlignment: "Center",
            },
            {
              type: "TextBlock",
              text: `Elo ${data.challengedElo}`,
              size: "Small",
              isSubtle: true,
              horizontalAlignment: "Center",
              spacing: "None",
            },
          ],
        },
      ],
    },
  ];

  if (data.message) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (bodyItems as any[]).push({
      type: "TextBlock",
      text: `_"${data.message}"_`,
      wrap: true,
      isSubtle: true,
    });
  }

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.2",
          body: bodyItems,
        },
      },
    ],
  };
}

export function sendChallengeNotification(
  data: ChallengeNotificationData
): void {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error(
      "Challenge notification skipped: missing TEAMS_WEBHOOK_URL"
    );
    return;
  }

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildChallengeCard(data)),
  })
    .then((res) => {
      if (!res.ok) {
        console.error("Challenge notification failed:", res.status, res.statusText);
      }
    })
    .catch((err) => {
      console.error("Challenge notification error:", err);
    });
}
