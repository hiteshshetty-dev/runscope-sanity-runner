import { ValidationError, Validator } from 'jsonschema'
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { configSchema } from './configSchema.js'
import { ITriggerSanity } from './triggerSanity.js';
export function ISTDateTime() {
    const now = new Date();

    // Define options for formatting the time
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        hour: '2-digit',
        hour12: false, // Use 24-hour format
        minute: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Kolkata' // Set the time zone to IST
    };

    // Get the current time in IST
    return now.toLocaleTimeString('en-US', options);
}

export interface IConfig {
    runscopeDetails: RunscopeDetails
    shareReportToFollowingUsers: string[]
    slackDetails: SlackDetails
    googleCredentialsPath: string
    threadMessagePrefix?: string
}

export interface SlackDetails {
    apiToken: string
    channel: string
}

export interface RunscopeDetails {
    envName: string
    envUid: string
    triggerUids: string[]
    webhookUrl: string

}

function checkConfig(config: IConfig) {
    const v = new Validator();
    const res = v.validate(config, configSchema, { nestedErrors: true, throwError: true });
    return res.valid;
}

function throwConfigError(error: ValidationError) {
    const { argument, name, path } = error;
    let fieldName = path.join('.');
    if (fieldName === '') {
        fieldName = argument || 'Config';
    }

    if (name === 'required') {
        throw new Error(`${fieldName} is mandatory while defining config.`);
    } else if (name === 'type') {
        throw new Error(`Invalid key type. ${fieldName} must be of ${argument[0] || 'string'} type(s).`);
    }
}

export async function getConfig(configPath: string) {
    let resolvedConfig: IConfig;
    try {
        const resolvedConfigString = await readFileSync(resolve(configPath), 'utf8');
        resolvedConfig = JSON.parse(resolvedConfigString);
        if (checkConfig(resolvedConfig)) {
            return resolvedConfig;
        }
        // @ts-expect-error
    } catch (error: NodeJS.ErrnoException | ValidationError) {
        if (error.code === 'ENOENT' || error.code === 'MODULE_NOT_FOUND') {
            throw new Error('The specified path to config file does not exist.');
        }

        if (error.schema) {
            throwConfigError(error);
        }

        throw error;
    }
}

export function transformConfig(config: IConfig) {
    const transformedConfig: ITriggerSanity = {
        runscopeEnvUID: config.runscopeDetails.envUid,
        slackApiToken: config.slackDetails.apiToken,
        slackChannelId: config.slackDetails.channel,
        testEnvName: config.runscopeDetails.envName,
        triggerUIDs: config.runscopeDetails.triggerUids,
        userEmails: config.shareReportToFollowingUsers,
        webhookUrl: config.runscopeDetails.webhookUrl,
        googleCredsPath: config.googleCredentialsPath,
        threadMessagePrefix: config.threadMessagePrefix
    }
    return transformedConfig
}