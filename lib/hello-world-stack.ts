import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import Lambda L2 construct
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import assets = require("aws-cdk-lib/aws-s3-assets")
import path = require("path")

export class HelloWorldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, 'myCodeBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    
    // Golang binaries must have a place where they are uploaded to s3 as a .zip
     const asset = new assets.Asset(this, 'ExampleFunctionZip', {
      path: path.join(__dirname, '../lambda/helloWolrdGo.zip'),
    });

    // Define the Lambda function resource
    const helloWorldFunction = new lambda.Function(this, 'HelloWorldFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023, 
      handler: 'main', // Points to the 'hello' file in the lambda directory
      code: lambda.Code.fromBucket(
        asset.bucket,
        asset.s3ObjectKey
      ), // Points to the lambda directory      
    });

     // Define the API Gateway resource
     const api = new apigateway.LambdaRestApi(this, 'HelloWorldApi', {
      handler: helloWorldFunction,
      proxy: false,
    });
        
    // Define the '/hello' resource with a GET method
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod('GET');

  }
}
