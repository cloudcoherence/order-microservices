const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");

module.exports.ingestOrder = async (event) => {
  const tableName = process.env.orderDetailTable;
  const randomSixDigitNumber = generateRandomSixDigitNumber();

  for (const record of event.Records) {
    const order = JSON.parse(record.body);

    const params = {
      TableName: tableName,
      Item: {
        orderId: uuidv4(),
        orderCreatedDate: new Date().toISOString(),
        systemEvent: order.systemEvent,
        fact: order.fact,
      },
    };

    try {
      await dynamoDB.put(params).promise();
      console.log(`Order with ID ${params.Item.orderId} saved successfully.`);
    } catch (error) {
      console.error(
        `Failed to save order with ID ${params.Item.orderId}: `,
        error
      );
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Order processed successfully!",
    }),
  };
};

module.exports.fetchOrder = async (event) => {
  const tableName = process.env.orderDetailTable;
  const orderId = event.pathParameters.orderId;

  const params = {
    TableName: tableName,
    Key: {
      orderId: Number(orderId),
    },
  };

  try {
    const result = await dynamoDB.get(params).promise();
    if (result.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Order not found" }),
      };
    }
  } catch (error) {
    console.error(`Failed to fetch order with ID ${orderId}: `, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
