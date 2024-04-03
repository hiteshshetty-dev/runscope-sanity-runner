// This script will run trigger sanity by running runscope tests
import axios from 'axios'
import { drive_v3, google, sheets_v4 } from 'googleapis'

import { ISTDateTime } from './index.js';
import { GoogleAuth, JSONClient } from 'google-auth-library/build/src/auth/googleauth.js';

const sheets = google.sheets('v4');

class GoogleSheet {
    constructor(keyFile: string) {
        GoogleSheet.authClient = new google.auth.GoogleAuth({
            keyFile: keyFile,
            scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        });
        GoogleSheet.drive = google.drive({
            auth: GoogleSheet.authClient,
            version: 'v3'
        });
    }
    static authClient: GoogleAuth<JSONClient>;
    static drive: drive_v3.Drive;

}

interface IShareSpreadsheetWithUsers {
    spreadsheetId: string;
    userEmails: string[];
}
async function shareSpreadsheetWithUsers({ spreadsheetId, userEmails }: IShareSpreadsheetWithUsers) {
    try {
        // Retrieve the existing permissions (optional but can be useful)
        const permissionsResponse = await GoogleSheet.drive.permissions.list({
            auth: GoogleSheet.authClient,
            fileId: spreadsheetId,
        });

        if (!permissionsResponse.data.permissions) {
            console.log('No permissions found')
            return
        }

        // Add new permissions for each user
        for (const email of userEmails) {
            // Define the permission object
            const permission = {
                emailAddress: email,
                role: 'writer', // Change 'writer' to 'reader' for viewer access
                type: 'user',
            };

            // Check if the user already has access, if not, add the permission
            const userHasAccess = permissionsResponse.data.permissions.some(
                (perm) => perm.emailAddress === email
            );

            if (userHasAccess) {
                console.log(`${email} already has access`);
            } else {
                GoogleSheet.drive.permissions.create({
                    auth: GoogleSheet.authClient,
                    fileId: spreadsheetId,
                    requestBody: {
                        ...permission
                    },
                    sendNotificationEmail: false
                });

                console.log(`Added ${permission.role} permission for ${email}`);
            }
        }

        console.log('Sharing complete');
    } catch (error) {
        console.error(`Error sharing spreadsheet: ${error}`);
    }
}

interface ISendSlackMessage {
    googleSheetURL: string;
    slackApiToken: string;
    slackChannelId: string;
    testEnvName: string;
    threadMessagePrefix?: string;
    totalModules?: number
}
async function sendSlackMessage({ googleSheetURL, slackApiToken, slackChannelId, testEnvName, threadMessagePrefix="", totalModules=0 }: ISendSlackMessage) {
    try {
        const header = {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `📝 ${threadMessagePrefix}Sanity triggered on *${testEnvName}* environment `
            }
        };
        const summary = {
            "type": "rich_text",
            "elements": [
                {
                    "type": "rich_text_section",
                    "elements": [
                        {
                            "type": "text",
                            "text": "Report Summary:"
                        }
                    ]
                },
                {
                    "type": "rich_text_list",
                    "style": "bullet",
                    "elements": [
                        {
                            "type": "rich_text_section",
                            "elements": [
                                {
                                    "type": "text",
                                    "text": "Total Modules: "
                                },
                                {
                                    "type": "text",
                                    "text": String(totalModules)
                                }
                            ]
                        },
                        {
                            "type": "rich_text_section",
                            "elements": [
                                {
                                    "type": "text",
                                    "text": "Passed Modules: "
                                },
                                {
                                    "type": "text",
                                    "text": "0"
                                }
                            ]
                        },
                        {
                            "type": "rich_text_section",
                            "elements": [
                                {
                                    "type": "text",
                                    "text": "Failed Modules: "
                                },
                                {
                                    "type": "text",
                                    "text": "0"
                                }
                            ]
                        },
                        {
                            "type": "rich_text_section",
                            "elements": [
                                {
                                    "type": "text",
                                    "text": "Total Duration: "
                                },
                                {
                                    "type": "text",
                                    "text": "0"
                                },
                                {
                                    "type": "text",
                                    "text": " secs "
                                },
                                {
                                    "type": "emoji",
                                    "name": "clock"
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        const sheetReport = {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `<${googleSheetURL}|View complete result>`,
            },
        };
        const response: any = await axios.post('https://slack.com/api/chat.postMessage', {
            channel: slackChannelId,
            blocks: [header, summary, { type: "divider" }, sheetReport],
            text: "Report Summary",
        }, {
            headers: {
                Authorization: `Bearer ${slackApiToken}`,
                'Content-Type': 'application/json',
            }
        })
        return response?.data?.ts;
    } catch (error) {
        console.error('Error sending Slack message:', error);
        return null;
    }
}

async function createHeaderRow(spreadsheetId: string) {
    try {
        // Define the values for the header row
        const headerRow = [['Test Name', 'Test Result', 'Test Link']];
        // Create a request to update the values
        const request: sheets_v4.Params$Resource$Spreadsheets$Values$Update = {
            auth: GoogleSheet.authClient,
            range: 'Sheet1!A1:C1', // Change the sheet and cell range as needed
            requestBody: {
                values: headerRow,
            },
            spreadsheetId,
            valueInputOption: 'RAW'
        };
        // Send the request to update the header row
        const sheetsResponse = await sheets.spreadsheets.values.update(request);

        console.log('Header row created:', sheetsResponse.data);
    } catch (error) {
        console.error('Error creating header row:', error);
    }
}


async function createNewSpreadsheet(newSpreadsheetTitle: string, userEmails: string[] = []) {
    try {
        const spreadsheetResponse = await sheets.spreadsheets.create({
            auth: GoogleSheet.authClient,
            requestBody: {
                properties: {
                    title: newSpreadsheetTitle
                }
            }
        });

        const {spreadsheetId} = spreadsheetResponse.data;
        console.log(`Created a new spreadsheet with ID: ${spreadsheetId}`);


        if (spreadsheetId) {
            await createHeaderRow(spreadsheetId)
            await shareSpreadsheetWithUsers({ spreadsheetId, userEmails })
        }

        return spreadsheetId
    } catch (error) {
        console.error(`Error creating a new spreadsheet: ${error}`);
    }
}

export interface ITriggerSanity {
    runscopeEnvUID: string;
    slackApiToken: string;
    slackChannelId: string;
    testEnvName: string;
    triggerUIDs: string[];
    userEmails: string[];
    webhookUrl: string;
    googleCredsPath: string;
    threadMessagePrefix?: string;
}
export default async function runTest({
    runscopeEnvUID,
    slackApiToken,
    slackChannelId,
    testEnvName,
    triggerUIDs,
    userEmails,
    webhookUrl,
    googleCredsPath,
    threadMessagePrefix = ""
}: ITriggerSanity) {
    new GoogleSheet(googleCredsPath);
    
    const spreadsheetId = await createNewSpreadsheet(`Sanity Test Results - ${testEnvName} - ${ISTDateTime()}`, userEmails);
    const response = await sendSlackMessage({
        googleSheetURL: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        slackApiToken,
        slackChannelId,
        testEnvName,
        threadMessagePrefix,
        totalModules: triggerUIDs.length
    });
    const testTriggerURLS = triggerUIDs.map((triggerUid: string) => `https://api.runscope.com/radar/${triggerUid}/trigger?runscope_environment=${runscopeEnvUID}&runscope_notification_url=${webhookUrl}&slack_thread_ts=${response}&spreadsheet_id=${spreadsheetId}&slack_channel_id=${slackChannelId}`)
    const testTriggerURLSLength = testTriggerURLS.length
    console.log(`Number of test trigger urls: ${testTriggerURLSLength}`)
    
    const promises = testTriggerURLS.map((testTriggerURL: string) => axios.get(testTriggerURL) as unknown as Promise<APIResponse>)

    const resolved = await Promise.allSettled(promises)

    for (const promise of resolved) {
        if (promise.status === 'rejected') {
            console.log(promise)
            throw new Error(promise.reason)
        }
    }
}

// Types

interface APIResponse {
    data: Data
    error: Record<string, string>
    meta: Meta
}

interface Meta {
    status: string
}

interface Data {
    runs: Run[]
    runs_failed: number
    runs_started: number
    runs_total: number
}

interface Run {
    agent: Record<string, string>
    api_test_run_url: string
    bucket_key: string
    environment_id: string
    environment_name: string
    region: string
    status: string
    test_id: string
    test_name: string
    test_run_id: string
    test_run_url: string
    test_url: string
    url: string
    variables: Variables
}

interface Variables { }
