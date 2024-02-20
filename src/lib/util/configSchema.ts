export const configSchema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Generated schema for Root",
    "type": "object",
    "properties": {
        "slackDetails": {
            "type": "object",
            "properties": {
                "apiToken": {
                    "type": "string"
                },
                "channel": {
                    "type": "string"
                }
            },
            "required": [
                "apiToken",
                "channel"
            ]
        },
        "runscopeDetails": {
            "type": "object",
            "properties": {
                "envName": {
                    "type": "string"
                },
                "envUid": {
                    "type": "string"
                },
                "triggerUids": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "webhookUrl": {
                    "type": "string"
                }
            },
            "required": [
                "envName",
                "envUid",
                "triggerUids",
                "webhookUrl"
            ]
        },
        "shareReportToFollowingUsers": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "googleCredentialsPath": {
            "type": "string"
        },
        "threadMessagePrefix": {
            "type": "string"
        }
    },
    "required": [
        "slackDetails",
        "runscopeDetails",
        "shareReportToFollowingUsers",
        "googleCredentialsPath"
    ]
}