import * as cdk from 'aws-cdk-lib'
import { TripAdvisorStack } from '../lib/infra-stack'

const app = new cdk.App()

new TripAdvisorStack(app, 'TripAdvisorStack', {
  env: {
    account: process.env['CDK_DEFAULT_ACCOUNT'],
    region: process.env['CDK_DEFAULT_REGION'] ?? 'us-east-1',
  },
})
