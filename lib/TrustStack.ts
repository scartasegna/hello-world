import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";


// You can use the AWS CDK CLI to deploy this stack with the following command:
// cdk deploy --parameters GitHubOrg=<org> --parameters GitHubRepo=<repo>
export class TrustStack extends cdk.Stack {
 constructor(scope: Construct, id: string, props?: cdk.StackProps) {
   super(scope, id, props);


   // -- Parameters you will need to provide at deploy time. --
   // This stack is parameterized so that you can use it without modification.
   const githubOrg = new cdk.CfnParameter(this, "GitHubOrg", {
     type: "String",
     description: "The GitHub organization that owns the repository.",
   });
   const githubRepo = new cdk.CfnParameter(this, "GitHubRepo", {
     type: "String",
     description: "The GitHub repository that will run the action.",
   });


   // -- Defines an OpenID Connect (OIDC) provider for GitHub Actions. --
   // This provider will be used by the GitHub Actions workflow to
   // assume a role which can be used to deploy the CDK application.
   const githubProvider = new iam.CfnOIDCProvider(this, "GitHubOIDCProvider", {
     thumbprintList: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
     url: "https://token.actions.githubusercontent.com", // <-- 1 per account
     clientIdList: ["sts.amazonaws.com"], // <-- Tokens are intended for STS
   });


   // -- Defines a role that can be assumed by GitHub Actions. --
   // This role will be used by the GitHub Actions workflow to deploy the stack.
   // It is assumable only by GitHub Actions running against the `master` branch
   const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
     assumedBy: new iam.FederatedPrincipal(
       githubProvider.attrArn,
       {
         StringLike: {
           // This specifies that the subscriber (sub) claim must be the master
           // branch of the repository. 
           "token.actions.githubusercontent.com:sub": [
             `repo:${githubOrg.valueAsString}/${githubRepo.valueAsString}:ref:refs/heads/master`,
           ],
         },
         // This specifies that the audience (aud) claim must be sts.amazonaws.com
         StringEquals: {
           "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
         },
       },
       "sts:AssumeRoleWithWebIdentity" // <-- Allows use of OIDC identity
     ),
   });


   // -- A policy to permit assumption of the default AWS CDK roles. --
     const assumeCdkDeploymentRoles = new iam.PolicyStatement({
     effect: iam.Effect.ALLOW,
     actions: ["sts:AssumeRole"],
     resources: ["arn:aws:iam::*:role/cdk-*"],
     conditions: {
       StringEquals: {
         "aws:ResourceTag/aws-cdk:bootstrap-role": [
           "file-publishing",
           "lookup",
           "deploy",
         ],
       },
     },
   });


   // Add the policy statement to the GitHub Actions role so it can actually
   // assume the CDK deployment roles it will require.
   githubActionsRole.addToPolicy(assumeCdkDeploymentRoles);


   new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
     value: githubActionsRole.roleArn,
     description: (
       "The role ARN for GitHub Actions to use during deployment."
     )
   });
 }
}