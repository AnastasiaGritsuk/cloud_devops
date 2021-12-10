import { promises as fsp } from 'fs';
import { ChildProcess, fork, spawn, exec } from "child_process";
import * as AWS from 'aws-sdk';

const cwd = "src/app/notifications/handlers";
const tsc = `node_modules/typescript/bin/tsc`;
const FunctionName = 'send-email';
const Role = 'arn:aws:iam::136433206089:role/lambda-ex';

if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = process.env.REGION ?? process.env.AWS_DEFAULT_REGION ?? 'us-east-1';
}

const spawnAsync = (command: string, cwd = process.cwd()) => {
  const childProcess = spawn(command, { cwd, shell: true });

  return waitProcess(childProcess);
}

const compile = async (file: string) => {
  const compilerProcess = fork(`${tsc}`, [file]);

  return waitProcess(compilerProcess);
}

const waitProcess = async (childProcess: ChildProcess) => {
  return new Promise((resolve, reject) => {
    childProcess.stdout?.pipe(process.stdout);
    childProcess.stderr?.pipe(process.stderr);

    childProcess.on('close', resolve);
    childProcess.on('error', reject);
  })
}

const createLambda = async () => {
  await compile(`${cwd}/sendEmail.ts`);
  await spawnAsync("zip -r sendEmail.zip sendEmail.js", cwd);

  const lambda = new AWS.Lambda();

  const functions = await lambda.listFunctions().promise();

  const ZipFile = await fsp.readFile(`${cwd}/sendEmail.zip`);

  let arn: string;

  if (!functions.Functions?.find(v => v.FunctionName === FunctionName)) {
    const sendEmailLambda = await lambda.createFunction({
      Runtime: 'nodejs14.x',
      FunctionName,
      Role,
      Handler: 'sendEmail.sendEmail',
      Code: {
        ZipFile
      }
    }).promise();

    arn = sendEmailLambda.FunctionArn!;
  } else {
    const sendEmailLambda = await lambda.updateFunctionCode({
      FunctionName,
      ZipFile,
    }).promise();

    arn = sendEmailLambda.FunctionArn!;
  }

  return arn;
};

const createApiGateway = async (lambdaArn: string) => {
  const apiGateway = new AWS.APIGateway({ apiVersion: '2015/07/09' });
  const restApiList = await apiGateway.getRestApis({}).promise();
  let restApi = restApiList.items?.find(item => item.name == "dev-share-api")

  if (!restApi) {
    restApi = await apiGateway.createRestApi({
      name: "dev-share-api",
      binaryMediaTypes: [
        '*'
      ],
    }).promise();
  }

  const resources = await apiGateway.getResources({ restApiId: restApi.id! }).promise();

  let root = resources.items?.find(item => !item.parentId);

  if (!root) {
    root = await apiGateway.createResource({
      restApiId: restApi.id!,
      parentId: "",
      pathPart: "/"
    }).promise();
  }

  let sendEmailResource = resources.items?.find(item => item.pathPart === "sendEmail");

  if (!sendEmailResource) {
    sendEmailResource = await apiGateway.createResource({
      restApiId: restApi.id!,
      parentId: root.id!,
      pathPart: "sendEmail"
    }).promise();
  }

  if (!sendEmailResource.resourceMethods?.['OPTIONS']) {
    await apiGateway.putMethod({
      restApiId: restApi.id!,
      resourceId: sendEmailResource.id!,
      httpMethod: 'OPTIONS',
      authorizationType: 'NONE',
    }).promise();

    await apiGateway.putMethodResponse({
      restApiId: restApi.id!,
      resourceId: sendEmailResource.id!,
      httpMethod: 'OPTIONS',
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
      }
    }).promise();

    await apiGateway.putIntegration({
      restApiId: restApi.id!,
      resourceId: sendEmailResource.id!,
      httpMethod: 'OPTIONS',
      type: 'MOCK',
      integrationHttpMethod: 'OPTIONS',
      requestTemplates: {
        'application/json': "{statusCode:200}"
      }
    }).promise();

    await apiGateway.putIntegrationResponse({
      restApiId: restApi.id!,
      resourceId: sendEmailResource.id!,
      httpMethod: 'OPTIONS',
      statusCode: '200',

      responseTemplates: {
        'application/json': "#set($origin = $input.params(\"Origin\"))\n#if($origin == \"\") #set($origin = $input.params(\"origin\")) #end\n#if($origin.matches(\".+\")) #set($context.responseOverride.header.Access-Control-Allow-Origin = $origin) #end"
      },
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,POST'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
      }
    }).promise();
  }

  if (!sendEmailResource.resourceMethods?.['POST']) {
    await apiGateway.putMethod({
      restApiId: restApi.id!,
      resourceId: sendEmailResource.id!,
      httpMethod: 'POST',
      authorizationType: 'NONE',
    }).promise();
  }

  const uri = `arn:aws:apigateway:${process.env.AWS_REGION}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`;

  await apiGateway.putIntegration({
    restApiId: restApi.id!,
    resourceId: sendEmailResource.id!,
    httpMethod: 'POST',
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    // credentials: 'arn:aws:iam::136433206089:role/lambda-ex',
    uri
  }).promise();

  await apiGateway.createDeployment({
    restApiId: restApi.id!,
    stageName: 'dev',
  }).promise();

  return restApi.id!
}

const entryPointRun = async () => {
  const lambdaArn = await createLambda();
  const restApi = await createApiGateway(lambdaArn!);

  const lambda = new AWS.Lambda();

  const sendEmailPolicy = await lambda.getPolicy({
    FunctionName,
  }).promise().catch(() => null);

  if (!(sendEmailPolicy?.Policy ?? '').includes('apigateway')) {
    await lambda.addPermission({
      FunctionName,
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
      StatementId: 'lambda-apigateway',
      SourceArn: `arn:aws:execute-api:${process.env.AWS_REGION}:136433206089:${restApi}/*/*`
    }).promise();
  }
}

// noinspection JSIgnoredPromiseFromCall
entryPointRun();
