# Lambda Function Setup

This guide will walk you through setting up a Lambda function using AWS Management Console. The Lambda function is designed to process incoming webhook payloads, send messages to Slack, and append data to Google Sheets based on the payload received.

## Setup Instructions

### 1. Upload the Axios-Googleapis Layer

- Navigate to the AWS Management Console.
- Go to the Lambda service.
- Click on "Layers" in the left-hand menu.
- Click on "Create layer".
- Upload the `axios-googleapis-layer.zip` file.
- Once uploaded, note the ARN of the created layer.

### 2. Create the Lambda Function

- In the Lambda service, click on "Create function".
- Choose "Author from scratch".
- Enter a name for your function.
- Choose the latest Node.js runtime.
- Under "Permissions", create a new role with basic Lambda permissions.
- Click on "Create function".

### 3. Configure the Function

- In the function configuration, scroll down to the "Layers" section.
- Click on "Add a layer".
- Select the layer you uploaded in step 1.
- Under "Function code", upload your `index.js` file containing the Lambda function code.
- In the "Environment variables" section, add the necessary variables such as `SERVICE_ACCOUNT`, `SLACK_CHANNEL_ID`, and `SLACK_TOKEN`.
- Click on "Save" to apply the changes.

### 4. Attach Lambda Function to API Gateway

- In the function configuration, click on "Add trigger".
- Choose "API Gateway" as the trigger type.
- Create a new API or choose an existing one.
- Configure the API Gateway trigger settings as needed.
- Click on "Add" to attach the Lambda function to the API Gateway.

### 5. Test the Function

- Use the provided API Gateway endpoint URL to trigger the Lambda function.
- Verify that the function executes as expected and performs the intended actions.

## Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)