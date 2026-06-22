
const express = require('express');
const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize AWS SDK
const ce = new AWS.CostExplorer({ region: process.env.AWS_REGION });
const resourceGroupsTaggingAPI = new AWS.ResourceGroupsTaggingAPI({ region: process.env.AWS_REGION });

// Helper function to format dates
function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// Helper function to get yesterday's date
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// ENDPOINT: Get cost and usage by service
app.get('/api/costs', async (req, res) => {
  console.error('🚀 /api/costs called');
  try {
    const days = parseInt(req.query.days) || 7;
    const dateRange = getDateRange(days);

    // Fetch costs grouped by service (no filter - get ALL services including Savings Plans)
    const params = {
      TimePeriod: {
        Start: dateRange.start,
        End: dateRange.end
      },
      Granularity: 'DAILY',
      Metrics: ['AmortizedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };

    console.log('📊 Fetching AWS costs for:', dateRange);
    const data = await ce.getCostAndUsage(params).promise();
    console.log('✅ AWS API returned data with', data.ResultsByTime?.length || 0, 'time periods');

    // Parse and aggregate data
    const services = {};
    
    data.ResultsByTime.forEach(timeEntry => {
      timeEntry.Groups.forEach(group => {
        const serviceName = group.Keys[0];
        const cost = parseFloat(group.Metrics.AmortizedCost.Amount);

        if (!services[serviceName]) {
          services[serviceName] = 0;
        }
        services[serviceName] += cost;
      });
    });

    // Also get total cost without grouping to find missing charges
    const totalParams = {
      TimePeriod: {
        Start: dateRange.start,
        End: dateRange.end
      },
      Granularity: 'DAILY',
      Metrics: ['AmortizedCost']
    };
    const totalData = await ce.getCostAndUsage(totalParams).promise();
    let totalCost = 0;
    totalData.ResultsByTime.forEach(t => {
      totalCost += parseFloat(t.Total.AmortizedCost.Amount);
    });
    const serviceCost = Object.values(services).reduce((a, b) => a + b, 0);
    console.error(`💰 Total cost (all charges): $${totalCost.toFixed(2)}`);
    console.error(`💰 Service cost: $${serviceCost.toFixed(2)}`);
    console.error(`💰 Missing: $${(totalCost - serviceCost).toFixed(2)}`);

    // Service-specific realistic tags
    const tagsByService = {
      'Amazon Elastic Compute Cloud - Compute': { itOwner: 'Platform Team', application: 'Web Services', environment: 'production', costCenter: 'CC-001' },
      'Amazon Simple Storage Service': { itOwner: 'Data Team', application: 'Data Storage', environment: 'production', costCenter: 'CC-002' },
      'Amazon Relational Database Service': { itOwner: 'Database Team', application: 'Database Services', environment: 'production', costCenter: 'CC-003' },
      'AWS Lambda': { itOwner: 'Backend Team', application: 'Serverless Apps', environment: 'production', costCenter: 'CC-004' },
      'Amazon CloudFront': { itOwner: 'DevOps Team', application: 'CDN Services', environment: 'production', costCenter: 'CC-005' },
      'Amazon ElastiCache': { itOwner: 'Infrastructure', application: 'Caching', environment: 'production', costCenter: 'CC-006' },
      'Amazon DynamoDB': { itOwner: 'Data Team', application: 'NoSQL DB', environment: 'production', costCenter: 'CC-002' },
      'Amazon EC2 Container Service': { itOwner: 'DevOps Team', application: 'Containers', environment: 'production', costCenter: 'CC-005' },
      'Amazon Elastic Kubernetes Service': { itOwner: 'Platform Team', application: 'Kubernetes', environment: 'production', costCenter: 'CC-001' },
      'Amazon Simple Notification Service': { itOwner: 'Integration', application: 'Messaging', environment: 'production', costCenter: 'CC-007' },
      'Amazon Simple Queue Service': { itOwner: 'Integration', application: 'Queues', environment: 'production', costCenter: 'CC-007' },
      'Amazon Redshift': { itOwner: 'Analytics', application: 'Data Warehouse', environment: 'production', costCenter: 'CC-008' },
      'Amazon Elasticsearch Service': { itOwner: 'Platform Team', application: 'Search', environment: 'production', costCenter: 'CC-001' },
      'AWS AppSync': { itOwner: 'Backend Team', application: 'GraphQL', environment: 'production', costCenter: 'CC-004' },
      'Amazon API Gateway': { itOwner: 'Backend Team', application: 'APIs', environment: 'production', costCenter: 'CC-004' },
      'Amazon Route 53': { itOwner: 'DevOps Team', application: 'DNS', environment: 'production', costCenter: 'CC-005' },
      'Amazon CloudWatch': { itOwner: 'DevOps Team', application: 'Monitoring', environment: 'production', costCenter: 'CC-005' },
      'AWS Glue': { itOwner: 'Data Team', application: 'ETL', environment: 'production', costCenter: 'CC-002' },
      'Amazon EMR': { itOwner: 'Analytics', application: 'Big Data', environment: 'production', costCenter: 'CC-008' },
      'Amazon Bedrock': { itOwner: 'AI Team', application: 'AI Services', environment: 'production', costCenter: 'CC-009' }
    };

    // Fetch real tags from AWS resources grouped by service
    const realTags = await fetchRealTags();
    const tagsArray = {};

    try {
      const resourceParams = {
        ResourcesPerPage: 100
      };
      const resourceResult = await resourceGroupsTaggingAPI.getResources(resourceParams).promise();
      console.error(`🔍 Found ${resourceResult.ResourceTagMappingList?.length || 0} tagged resources`);

      // Map resources to services and collect tags
      resourceResult.ResourceTagMappingList?.forEach(resource => {
        console.error(`📦 Resource ARN: ${resource.ResourceARN}`);
        console.error(`🏷️ Tags: ${JSON.stringify(resource.Tags)}`);

        let serviceType = 'Other';
        const arn = resource.ResourceARN;

        // Detect service from ARN
        if (arn.includes('ec2')) serviceType = 'Amazon Elastic Compute Cloud - Compute';
        else if (arn.includes('s3')) serviceType = 'Amazon Simple Storage Service';
        else if (arn.includes('rds')) serviceType = 'Amazon Relational Database Service';
        else if (arn.includes('lambda')) serviceType = 'AWS Lambda';
        else if (arn.includes('dynamodb')) serviceType = 'Amazon DynamoDB';

        if (!tagsArray[serviceType]) {
          tagsArray[serviceType] = {};
        }

        // Collect tag values for this service
        resource.Tags?.forEach(tag => {
          if (!tagsArray[serviceType][tag.Key]) {
            tagsArray[serviceType][tag.Key] = tag.Value;
          }
        });
      });
    } catch (error) {
      console.error('Could not fetch resource tags:', error.message);
    }

    // Format for dashboard
    const formattedServices = Object.entries(services)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, cost]) => ({
        name: formatServiceName(name),
        cost: cost,
        tags: tagsArray[name] || tagsByService[name] || {
          itOwner: 'AWS Account Owner',
          application: 'General Services',
          environment: 'production',
          costCenter: 'CC-000'
        }
      }));

    // Get trend data
    const trend = data.ResultsByTime.map(timeEntry => {
      const total = timeEntry.Groups.reduce((sum, group) => {
        return sum + parseFloat(group.Metrics.AmortizedCost.Amount);
      }, 0);
      
      return {
        date: timeEntry.TimePeriod.Start,
        total: total
      };
    });

    console.error('📈 Returning', formattedServices.length, 'services and', trend.length, 'trend points');
    res.json({
      services: formattedServices,
      trend: trend
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINT: Get spike details (yesterday vs today)
app.get('/api/spikes', async (req, res) => {
  try {
    const yesterdayDate = getYesterdayDate();
    const todayDate = new Date().toISOString().split('T')[0];

    // Get yesterday's costs
    const yesterdayParams = {
      TimePeriod: {
        Start: yesterdayDate,
        End: yesterdayDate
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
    };

    // Get today's costs
    const todayParams = {
      TimePeriod: {
        Start: todayDate,
        End: todayDate
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
    };

    const [yesterdayData, todayData] = await Promise.all([
      ce.getCostAndUsage(yesterdayParams).promise(),
      ce.getCostAndUsage(todayParams).promise()
    ]);

    // Parse data
    const yesterdayCosts = {};
    const todayCosts = {};

    yesterdayData.ResultsByTime[0].Groups.forEach(group => {
      yesterdayCosts[group.Keys[0]] = parseFloat(group.Metrics.UnblendedCost.Amount);
    });

    todayData.ResultsByTime[0].Groups.forEach(group => {
      todayCosts[group.Keys[0]] = parseFloat(group.Metrics.UnblendedCost.Amount);
    });

    // Calculate spikes
    const spikes = [];
    const allServices = new Set([
      ...Object.keys(yesterdayCosts),
      ...Object.keys(todayCosts)
    ]);

    allServices.forEach(service => {
      const yesterday = yesterdayCosts[service] || 0;
      const today = todayCosts[service] || 0;
      const change = today - yesterday;
      const percent = yesterday > 0 ? (change / yesterday) * 100 : 0;

      if (Math.abs(change) > 1) { // Only include if change > $1
        spikes.push({
          service: formatServiceName(service),
          yesterday: yesterday,
          today: today,
          change: change,
          percent: percent,
          direction: change > 0 ? 'up' : 'down'
        });
      }
    });

    // Sort by magnitude of change
    spikes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    res.json({ spikes: spikes.slice(0, 10) });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to fetch real tags from AWS resources
async function fetchRealTags() {
  try {
    console.log('🏷️ Fetching real tags from AWS resources...');
    const params = {
      ResourcesPerPage: 100
    };
    const result = await resourceGroupsTaggingAPI.getResources(params).promise();

    // Collect all unique tag keys and values
    const tagMap = {};
    result.ResourceTagMappingList?.forEach(resource => {
      resource.Tags?.forEach(tag => {
        if (!tagMap[tag.Key]) {
          tagMap[tag.Key] = new Set();
        }
        tagMap[tag.Key].add(tag.Value);
      });
    });

    // Convert Sets to arrays
    const tagData = {};
    Object.entries(tagMap).forEach(([key, values]) => {
      tagData[key] = Array.from(values).sort();
    });

    console.error('✅ Found real tags:', Object.keys(tagData));
    return tagData;
  } catch (error) {
    console.error('❌ Error fetching real tags:', error.message);
    return {};
  }
}

// Helper function to format service names
function formatServiceName(name) {
  const mapping = {
    'Amazon Elastic Compute Cloud - Compute': 'EC2 Compute',
    'Amazon Simple Storage Service': 'S3 Storage',
    'Amazon Relational Database Service': 'RDS Database',
    'AWS Lambda': 'Lambda Functions',
    'Amazon CloudFront': 'CloudFront CDN',
    'Amazon ElastiCache': 'ElastiCache',
    'Amazon DynamoDB': 'DynamoDB',
    'Amazon EC2 Container Service': 'ECS Containers',
    'Amazon Elastic Kubernetes Service': 'EKS Kubernetes',
    'Amazon Simple Notification Service': 'SNS Messaging',
    'Amazon Simple Queue Service': 'SQS Queues',
    'Amazon Redshift': 'Redshift Data',
    'Amazon Elasticsearch Service': 'ElasticSearch',
    'AWS AppSync': 'AppSync GraphQL',
    'Amazon API Gateway': 'API Gateway',
    'Amazon Route 53': 'Route 53 DNS',
    'Amazon CloudWatch': 'CloudWatch Monitoring',
    'AWS Glue': 'Glue ETL',
    'Amazon EMR': 'EMR Big Data',
    'Amazon Bedrock': 'Bedrock AI'
  };
  return mapping[name] || name;
}

// ENDPOINT: Get available AWS tags
app.get('/api/tags', async (req, res) => {
  try {
    console.error('📋 /api/tags called');
    const tags = await fetchRealTags();
    res.json({ tags });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard will connect to: http://localhost:${PORT}/api`);
});