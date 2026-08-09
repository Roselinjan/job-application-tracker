import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "ap-south-1";
const TABLE_NAME = process.env.TABLE_NAME;

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

export const handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email;
    if (!email) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          message: "Email is required."
        })
      };
    }
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email
        }
      })
    );

    const applications = result.Items || [];

    const stats = {
      total: applications.length,
      applied: 0,
      interview: 0,
      offered: 0,
      rejected: 0
    };

    for (const app of applications) {
      switch (app.status) {
        case "Applied":
          stats.applied++;
          break;

        case "Interview":
          stats.interview++;
          break;

        case "Offered":
          stats.offered++;
          break;

        case "Rejected":
          stats.rejected++;
          break;
      }
    }

    applications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        stats,
        applications
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Failed to load dashboard"
      })
    };
  }
};