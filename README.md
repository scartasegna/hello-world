# POC for a GO Lambda function deployed using CDK on typescript

To make this project work, you need:

- An AWS account where all resources will be deployed
- [Node.js + CDK ](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) in your local environment

The project is divided into two stacks:

 - **TrustStack**: This is responsible for creating an IAM identity provider (OpenID Connect), a role and a policy to enable trust between AWS account and GitHub Action for the org/repo/branch

 - **HelloWorldStack**: an S3 bucket where the Go artifact to be deployed, the object to be uploaded (zipped Go artifact), the Lambda function and the ApiGateway with the resource 

Also while executing the actions a simple hello world Go Project that respond  with a  message that will be built. The artifact will be deployed in a lambda function and served via the /hello GET resource in the API Gateway


### Creating the trust between AWS and GitHub

In this case, the branch will be master, but it can be changed in `lib/TrustStack.ts` line 45

The TrustStack needs two parameters:

| **Parameter** | **Value**                              |
|---------------|----------------------------------------|
| GitHubOrg     | Name of the GitHub organization.       |
| GitHubRepo    | Name of the GitHub repo with CDK code. |

the final command (for this repo) will be

 ```cdk deploy TrustStack --parameters GitHubOrg=scartasegna --parameters GitHubRepo=hello-world ```

If cdk has never been executed before, you may need to execute "[boostraped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)" before continuing.

After the process is complete, the value for **GitHubActionsRoleArn** will be prompet out. Save it, as it will be used later under a GitHub Secret for the Action workflow.

### Deploying the Lambda

Now the HelloWorldStack can be deployed manually or via a GitHub Action.

Don't forget that the code needs to be built in the `lambda` folder, but this is done via the Actions.

Before running the Action we will need the following assets under the repository configurations:

| **Parameter** | **type** | **Value**                                   |
|---------------|----------|---------------------------------------------|
| GitHubOrg     | secret   |  value for GitHubActionsRoleArn             |
| GitHubRepo    | variable | Region where the resources will be deployed |

A quick look at the file `.github/workflows/deploy-lambda.yaml` gives an overview of the steps:

1- Check out the repo

2- Set up the Go environment in the lambda folder

3- Install Go depencies

4- Build the Lambda and output it as [boostrap](https://aws.amazon.com/blogs/compute/migrating-aws-lambda-functions-from-the-go1-x-runtime-to-the-custom-runtime-on-amazon-linux-2/)

5- Zip the file

6- Configure the AWS credentials

7- Deploy the stack via CDK (in this case no approval is required)

More information:

[Creating a serveless app via CDK](https://docs.aws.amazon.com/cdk/v2/guide/serverless_example.html)

[Deploying a Lambda via a zip file](https://docs.aws.amazon.com/lambda/latest/dg/golang-package.html)

[Lambda in GO using CDK](https://blog.john-pfeiffer.com/using-aws-cdk-to-configure-deploy-a-golang-lambda-with-apigateway/)

[Trust via OpenID between Github Actions and AWS](https://github.com/myles2007/story-Using-Github-Actions-to-Deploy-a-CDK-Application/tree/main)