const axios = require('axios');
const {google} = require("googleapis")

exports.handler = async (event) => {
    try {
        // Parse the incoming event payload
        const payload = JSON.parse(event.body);
        
         // Extract relevant data from the event
        const testName = payload.test_name;
        const testStatus = payload.result === 'pass' ? 'Passed' : 'Failed';
        const testUrl = payload.test_run_url;
        const environmentName = payload.environment_name;
        const startedAt = new Date(payload.started_at * 1000);
        const finishedAt = new Date(payload.finished_at * 1000);
        const duration = (finishedAt - startedAt) / 1000;
        const statusEmoji = testStatus === 'Passed' ? '🟢\t ' : '🔴\t ';
        const stack_thread_ts = payload.variables.slack_thread_ts;
        
        if(!stack_thread_ts){
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Webhook processed successfully' }),
            }
        }

        // Create the Slack message text with hyperlinks and advanced Markdown
        const slackMessage = {
        	"blocks": [
        		{
        			"type": "header",
        			"text": {
        				"type": "plain_text",
        				"text": statusEmoji + testName
        			}
        		},
        		{
        			"type": "section",
        			"fields": [
        				{
        					"type": "mrkdwn",
        					"text": `*Status:*\n${testStatus}`
        				},
        				{
        					"type": "mrkdwn",
        					"text": `*Environment:*\n${environmentName}`
        				}
        			]
        		},
        		{
        			"type": "section",
        			"text": {
        				"type": "mrkdwn",
        				"text": `*Duration:* ${duration} seconds`
        			}
        		},
        		{
        			"type": "section",
        			"text": {
        				"type": "mrkdwn",
        				"text": `<${testUrl}|View result>`
        			}
        		}
        	]
        };

        // Send the Slack message
        await sendSlackMessage(slackMessage, stack_thread_ts);

        const spreadsheetId = payload.variables.spreadsheet_id; 
        const sheetName = 'Sheet1';
        const rowData = [
          testName,
          testStatus,
          testUrl
        ];
        
        if(spreadsheetId){
            await addRowToSpreadsheet(spreadsheetId, sheetName, rowData)
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Webhook processed successfully' }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An error occurred' }),
        };
    }
};
async function addRowToSpreadsheet(spreadsheetId, sheetName, rowData) {
  try {
    const serviceAccountKey = JSON.parse(process.env.SERVICE_ACCOUNT)
    // Authenticate with Google Sheets using the service account key
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    });

    // Create a Google Sheets client
    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare the values to append
    const values = [rowData];

    // Append the row to the specified sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:C`, // Adjust the range as needed
      valueInputOption: 'RAW',
      auth: auth,
      requestBody: {
        values: values,
      }
    });

    console.log('Data appended to Google Sheets:', response.data);
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error);
  }
}

async function sendSlackMessage(message, stack_thread_ts) {
    const SLACK_API_TOKEN = process.env.SLACK_TOKEN;
    const SLACK_CHANNEL = process.env.SLACK_CHANNEL_ID;

    try {
        const response = await axios.post(
            'https://slack.com/api/chat.postMessage',
            {
                channel: SLACK_CHANNEL,
                blocks: message.blocks,
                thread_ts: stack_thread_ts
            },
            {
                headers: {
                    Authorization: `Bearer ${SLACK_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data.ok) {
            console.log('Slack message sent successfully:', message);
        } else {
            console.error('Failed to send Slack message:', response.data.error);
        }
    } catch (error) {
        console.error('Error sending Slack message:', error);
    }
}
