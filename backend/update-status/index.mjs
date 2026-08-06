import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "ap-south-1";
const TABLE_NAME = process.env.TABLE_NAME;

const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION })
);

export const handler = async (event) => {
  try {
    const id = event.pathParameters.id;

    const body = JSON.parse(event.body);
    const { status } = body;

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          id: id
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": status
        }
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        message: "Status updated successfully."
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
        message: "Failed to update status."
      })
    };
  }
};