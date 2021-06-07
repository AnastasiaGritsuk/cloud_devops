import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { SES } from 'aws-sdk';
import { Quote } from "../../models/quote";

const ses = new AWS.SES({});

export const sendEmail: APIGatewayProxyHandler = async (event: { body: any }, _context: any) => {

  console.log('lambda sendEmail invocation with', event);

  const { email, quote }: { email: string, quote: Quote } = JSON.parse(event.body);
  console.log('email', email)
  console.log('quote', quote)
  console.log('text', quote.text)

  if (!email || !quote) {
    console.log('missing')
    return {
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 404,
      body: JSON.stringify({
        message: 'Empty data',
      }, null, 2),
    };
  }

  const params: SES.Types.SendEmailRequest = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Text: {
          Data: quote.text
        }
      },
      Subject: { Data: "Quote App" }
    },
    Source: "noreply@ses.r4.by"
  }

  console.log('parameters', params)
  try {
    await ses.sendEmail(params).promise();

    console.log('email sent');

    return {
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 200,
      body: JSON.stringify({
        message: 'SendEmail function executed successfully!',
        input: event,
      }, null, 2),
    };
  } catch (err) {
    console.log('err ', err);
    return {
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 500,
      body: JSON.stringify(
        {
          message: err.message,
          stack: err.stack
        },
        null,
        2
      ),
    };
  }



}
