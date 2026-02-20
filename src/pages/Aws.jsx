import ContentPage from '../components/ContentPage'
import CodeBlock from '../components/CodeBlock'
import AnimatedSection from '../components/AnimatedSection'
import TableOfContents from '../components/TableOfContents'

const sections = [
  { id: 'ecs-over-ec2', title: 'ECS Over EC2' },
  { id: 'rds-tuning', title: 'RDS: Tune It or Regret It' },
  { id: 'cloudwatch-alarms', title: 'CloudWatch Alarms That Actually Help' },
  { id: 'secrets-management', title: 'Secrets Management' },
  { id: 'ci-cd', title: 'CI/CD & Zero-Downtime Deploys' },
  { id: 's3-cloudfront', title: 'S3 + CloudFront Done Right' },
  { id: 'sqs-over-webhooks', title: 'SQS Over HTTP Webhooks' },
  { id: 'iam-least-privilege', title: 'IAM: Least Privilege in Practice' },
  { id: 'cost-awareness', title: 'Cost Awareness' },
  { id: 'logging-tracing', title: 'Logging & Tracing Across Services' },
]

function Section({ id, number, title, children }) {
  return (
    <AnimatedSection>
      <section id={id} className="mb-16 scroll-mt-28">
        <h2 className="font-mono text-cyan-400 text-sm mb-1">
          {`// ${String(number).padStart(2, '0')}`}
        </h2>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
          {title}
        </h3>
        <div className="text-gray-400 leading-relaxed space-y-4">
          {children}
        </div>
      </section>
    </AnimatedSection>
  )
}

export default function Aws() {
  return (
    <ContentPage
      title="AWS in Production"
      subtitle="What I've learned running Rails apps on AWS — not tutorial stuff, real production patterns."
    >
      <TableOfContents sections={sections} />

      {/* 1 — ECS Over EC2 */}
      <Section id="ecs-over-ec2" number={1} title="ECS Over EC2">
        <p>
          Managing EC2 instances directly is a trap. You start with one box, then you need
          auto-scaling, then you&apos;re patching AMIs, managing SSH keys, debugging why one
          instance has a different config than the others. ECS with Fargate eliminates all of
          that — you define your container, set resource limits, and let AWS handle the rest.
        </p>
        <p>
          The mental model shift: stop thinking about servers and start thinking about tasks.
          A task definition is your unit of deployment. It declares what container to run, how
          much CPU and memory it needs, what environment variables it gets, and what ports to
          expose. Your service wraps the task with scaling rules and a load balancer.
        </p>

        <CodeBlock title="task-definition.json (simplified)">
{`{
  "family": "my-rails-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "rails",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "portMappings": [{ "containerPort": 3000 }],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-rails-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "rails"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}`}
        </CodeBlock>

        <CodeBlock title="auto-scaling policy — terraform">
{`resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/my-cluster/my-rails-app"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-tracking"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 60.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}`}
        </CodeBlock>

        <p>
          Key decisions: Fargate over EC2 launch type unless you have very specific GPU or
          storage requirements. Target tracking over step scaling — it&apos;s simpler and
          handles most cases. Always set a minimum of 2 tasks for availability. And always
          define a health check — without one, ECS can&apos;t replace unhealthy tasks.
        </p>
      </Section>

      {/* 2 — RDS Tuning */}
      <Section id="rds-tuning" number={2} title="RDS: Tune It or Regret It">
        <p>
          The default RDS parameter group is optimized for nothing. It&apos;s a generic
          starting point that works &quot;okay&quot; for small apps and falls apart under
          real load. The first thing I do on any production RDS instance is create a custom
          parameter group and tune the settings that actually matter.
        </p>

        <CodeBlock title="key postgresql parameters">
{`# Custom parameter group — the settings that matter
shared_buffers          = {DBInstanceClassMemory / 4}    # 25% of instance memory
effective_cache_size    = {DBInstanceClassMemory * 3/4}  # 75% of instance memory
work_mem                = 64MB       # per-operation sort/hash memory
maintenance_work_mem    = 512MB      # for VACUUM, CREATE INDEX
random_page_cost        = 1.1        # SSD storage (default 4.0 is for spinning disk)
effective_io_concurrency = 200       # SSD can handle parallel I/O
max_connections         = 200        # don't go crazy — use connection pooling

# WAL settings for write-heavy workloads
wal_buffers             = 64MB
checkpoint_completion_target = 0.9
max_wal_size            = 2GB

# Query planning
default_statistics_target = 100      # more accurate query plans
log_min_duration_statement = 500     # log queries slower than 500ms`}
        </CodeBlock>

        <p>
          Connection pooling is non-negotiable. Rails opens a database connection per thread,
          and Puma with 5 threads across 10 ECS tasks means 50 connections minimum. Add
          Sidekiq workers and you&apos;re at 200+ easily. PgBouncer sits between your app and
          RDS, multiplexing connections so you don&apos;t hit the max.
        </p>

        <CodeBlock title="pgbouncer.ini — transaction-mode pooling">
{`[databases]
myapp = host=myapp.abc123.us-east-1.rds.amazonaws.com port=5432 dbname=myapp_production

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Transaction pooling — connection returned after each transaction
pool_mode = transaction
max_client_conn = 500
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts
server_idle_timeout = 600
client_idle_timeout = 0
query_timeout = 30`}
        </CodeBlock>

        <p>
          Read replicas: use them for reporting queries and read-heavy endpoints, not as a
          general scaling strategy. If your primary is overloaded, the answer is usually
          better queries and indexes, not throwing a replica at it. Replicas add replication
          lag, and stale reads in a transactional app cause subtle, horrible bugs.
        </p>
      </Section>

      {/* 3 — CloudWatch Alarms */}
      <Section id="cloudwatch-alarms" number={3} title="CloudWatch Alarms That Actually Help">
        <p>
          Most teams set up CloudWatch alarms wrong. Either they alarm on everything (and
          everyone learns to ignore them) or they alarm on nothing (and find out about
          outages from customers). The goal is a small set of high-signal alarms that
          actually mean &quot;someone needs to look at this right now.&quot;
        </p>

        <CodeBlock title="terraform — the alarms that matter">
{`# ECS task count dropped below minimum — something crashed
resource "aws_cloudwatch_metric_alarm" "ecs_task_count" {
  alarm_name          = "ecs-running-tasks-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Minimum"
  threshold           = 2
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = "my-cluster"
    ServiceName = "my-rails-app"
  }
}

# RDS CPU sustained above 80% — query optimization needed
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

# RDS free storage dropping — you don't want to find out at 0
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Minimum"
  threshold           = 5368709120  # 5GB in bytes
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

# ALB 5xx error rate — your app is returning errors to users
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.alerts.arn]
}`}
        </CodeBlock>

        <p>
          Composite alarms are underused. Instead of getting paged for CPU <em>and</em> memory
          <em>and</em> task count separately, create a composite alarm that fires when multiple
          signals are bad simultaneously. That&apos;s the difference between &quot;something is
          degraded&quot; and &quot;we have a real incident.&quot;
        </p>
        <p>
          The anti-pattern: alarming on every single metric with a static threshold. CPU hit 70%
          for 30 seconds at 2 PM? That&apos;s normal traffic. CPU hit 70% at 3 AM? That&apos;s
          suspicious. Use anomaly detection for metrics with predictable patterns, and static
          thresholds for hard limits (disk space, error counts).
        </p>
      </Section>

      {/* 4 — Secrets Management */}
      <Section id="secrets-management" number={4} title="Secrets Management">
        <p>
          If your secrets are in environment variables defined directly in your task definition
          or — worse — committed to your repo, you&apos;re one misconfigured IAM policy away
          from leaking everything. AWS has two good options: SSM Parameter Store (free for
          standard parameters) and Secrets Manager (paid, but handles rotation).
        </p>
        <p>
          My default: SSM Parameter Store for most things, Secrets Manager for database
          credentials that need automatic rotation. Both integrate natively with ECS task
          definitions — the container gets the secret injected at launch without your
          application code knowing or caring where it came from.
        </p>

        <CodeBlock title="task definition — secrets from SSM">
{`{
  "containerDefinitions": [
    {
      "name": "rails",
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/myapp/prod/DATABASE_URL"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/myapp/prod/REDIS_URL"
        },
        {
          "name": "SECRET_KEY_BASE",
          "valueFrom": "arn:aws:ssm:us-east-1:123456789:parameter/myapp/prod/SECRET_KEY_BASE"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:myapp/prod/stripe"
        }
      ],
      "environment": [
        { "name": "RAILS_ENV", "value": "production" },
        { "name": "RAILS_LOG_TO_STDOUT", "value": "true" }
      ]
    }
  ]
}`}
        </CodeBlock>

        <CodeBlock title="storing secrets — CLI">
{`# Standard SSM parameter (free, no rotation)
aws ssm put-parameter \\
  --name "/myapp/prod/SECRET_KEY_BASE" \\
  --type "SecureString" \\
  --value "your-secret-key-base-here"

# Secrets Manager (paid, supports rotation)
aws secretsmanager create-secret \\
  --name "myapp/prod/stripe" \\
  --secret-string '{"api_key":"sk_live_xxx"}'

# List all parameters for an environment
aws ssm get-parameters-by-path \\
  --path "/myapp/prod/" \\
  --with-decryption \\
  --query "Parameters[].Name"`}
        </CodeBlock>

        <p>
          The rule: anything that would be a problem if it leaked goes in SSM or Secrets Manager.
          Non-sensitive config (RAILS_ENV, log levels) stays as plain environment variables.
          Never mix the two — if you see a <code className="text-cyan-400">SecureString</code> next
          to a plaintext env var for similar data, something&apos;s wrong.
        </p>
      </Section>

      {/* 5 — CI/CD */}
      <Section id="ci-cd" number={5} title="CI/CD & Zero-Downtime Deploys">
        <p>
          A deploy should be boring. Push to main, tests run, image builds, ECS rolls out new
          tasks behind the load balancer, old tasks drain, done. If deploys are stressful,
          something is wrong with your pipeline — not your code.
        </p>
        <p>
          On ECS, the key to zero-downtime deploys is the rolling update strategy combined with
          proper health checks. ECS launches new tasks, waits for them to pass health checks,
          then drains connections from old tasks before stopping them.
        </p>

        <CodeBlock title="github actions — build and deploy to ECS">
{`name: Deploy to ECS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: us-east-1

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        env:
          ECR_REGISTRY: \${{ steps.ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/my-app:$IMAGE_TAG .
          docker push $ECR_REGISTRY/my-app:$IMAGE_TAG

      - name: Update ECS service
        env:
          IMAGE_TAG: \${{ github.sha }}
        run: |
          # Register new task definition with updated image
          TASK_DEF=$(aws ecs describe-task-definition \\
            --task-definition my-rails-app \\
            --query 'taskDefinition' | \\
            jq --arg IMG "$ECR_REGISTRY/my-app:$IMAGE_TAG" \\
            '.containerDefinitions[0].image = $IMG |
             del(.taskDefinitionArn, .revision, .status,
                 .requiresAttributes, .compatibilities,
                 .registeredAt, .registeredBy)')

          NEW_ARN=$(echo $TASK_DEF | \\
            aws ecs register-task-definition \\
              --cli-input-json "file:///dev/stdin" \\
              --query 'taskDefinition.taskDefinitionArn' \\
              --output text)

          # Update service — ECS handles rolling deployment
          aws ecs update-service \\
            --cluster my-cluster \\
            --service my-rails-app \\
            --task-definition $NEW_ARN \\
            --force-new-deployment`}
        </CodeBlock>

        <CodeBlock title="ECS service — rolling update config (terraform)">
{`resource "aws_ecs_service" "rails" {
  name            = "my-rails-app"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.rails.arn
  desired_count   = 3

  deployment_configuration {
    minimum_healthy_percent = 66   # keep 2/3 tasks running during deploy
    maximum_percent         = 200  # allow double capacity during rollout
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true  # auto-rollback if new tasks fail health checks
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.rails.arn
    container_name   = "rails"
    container_port   = 3000
  }
}`}
        </CodeBlock>

        <p>
          The circuit breaker is critical. Without it, a bad deploy will keep launching and
          failing tasks in a loop. With <code className="text-cyan-400">rollback = true</code>,
          ECS detects that new tasks aren&apos;t passing health checks and automatically rolls
          back to the last working task definition. You still get paged, but the app stays up.
        </p>
      </Section>

      {/* 6 — S3 + CloudFront */}
      <Section id="s3-cloudfront" number={6} title="S3 + CloudFront Done Right">
        <p>
          S3 is deceptively simple — put a file in, get a URL out. But in production, the
          details matter: presigned URLs for private content, lifecycle policies to avoid
          runaway storage costs, and CloudFront in front to keep latency low and S3 request
          costs down.
        </p>

        <CodeBlock title="app/services/generate_upload_url.rb — presigned uploads">
{`class GenerateUploadUrl
  EXPIRATION = 15.minutes

  def initialize(user:, filename:, content_type:)
    @user = user
    @filename = filename
    @content_type = content_type
  end

  def execute!
    key = "uploads/#{@user.id}/#{SecureRandom.uuid}/#{@filename}"

    presigned_url = s3_client.presigned_url(
      :put_object,
      bucket: ENV["S3_BUCKET"],
      key: key,
      content_type: @content_type,
      metadata: { "uploaded-by" => @user.id.to_s },
      expires_in: EXPIRATION.to_i
    )

    { url: presigned_url, key: key }
  end

  private

  def s3_client
    @s3_client ||= Aws::S3::Presigner.new
  end
end

# Controller: returns URL for client-side direct upload
# upload_info = GenerateUploadUrl.new(
#   user: current_user,
#   filename: "report.pdf",
#   content_type: "application/pdf"
# ).execute!`}
        </CodeBlock>

        <CodeBlock title="S3 lifecycle policy — terraform">
{`resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  # Move old uploads to cheaper storage
  rule {
    id     = "archive-old-uploads"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"  # ~40% cheaper
    }

    transition {
      days          = 365
      storage_class = "GLACIER"      # ~80% cheaper
    }
  }

  # Clean up incomplete multipart uploads (these silently cost money)
  rule {
    id     = "cleanup-multipart"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Auto-delete temp files
  rule {
    id     = "delete-temp"
    status = "Enabled"
    filter { prefix = "tmp/" }

    expiration {
      days = 1
    }
  }
}`}
        </CodeBlock>

        <p>
          The multipart upload cleanup rule is one most people miss. When a large upload fails
          partway through, the incomplete parts sit in S3 silently accumulating storage charges.
          I&apos;ve seen this add hundreds of dollars to a monthly bill before anyone noticed.
        </p>
        <p>
          CloudFront in front of S3 serves two purposes: latency (edge caching) and cost
          (CloudFront requests are cheaper than direct S3 requests at scale). For user-uploaded
          content, use short TTLs and signed URLs. For static assets (JS, CSS, images),
          use long TTLs with cache-busting filenames — Vite and Webpack already do this.
        </p>
      </Section>

      {/* 7 — SQS Over HTTP Webhooks */}
      <Section id="sqs-over-webhooks" number={7} title="SQS Over HTTP Webhooks">
        <p>
          When service A needs to tell service B something happened, the instinct is an HTTP
          call. But HTTP is synchronous, fragile, and requires both services to be up
          simultaneously. SQS decouples the sender from the receiver — messages queue up
          if the consumer is slow, retries are automatic, and you get a dead letter queue
          for messages that can&apos;t be processed.
        </p>

        <CodeBlock title="app/services/publish_event.rb — sending to SQS">
{`class PublishEvent
  def initialize(queue_name:, event_type:, payload:)
    @queue_name = queue_name
    @event_type = event_type
    @payload = payload
  end

  def execute!
    sqs.send_message(
      queue_url: queue_url,
      message_body: {
        event_type: @event_type,
        payload: @payload,
        published_at: Time.current.iso8601,
        idempotency_key: SecureRandom.uuid
      }.to_json,
      message_group_id: @payload[:id]&.to_s  # FIFO queues only
    )
  end

  private

  def sqs
    @sqs ||= Aws::SQS::Client.new
  end

  def queue_url
    @queue_url ||= sqs.get_queue_url(
      queue_name: @queue_name
    ).queue_url
  end
end

# Usage:
# PublishEvent.new(
#   queue_name: "order-events",
#   event_type: "order.shipped",
#   payload: { id: order.id, tracking: "1Z999..." }
# ).execute!`}
        </CodeBlock>

        <CodeBlock title="app/services/sqs_consumer.rb — processing messages">
{`class SqsConsumer
  MAX_MESSAGES = 10
  WAIT_TIME = 20  # long polling — reduces empty responses and cost

  def initialize(queue_name:, handler:)
    @queue_name = queue_name
    @handler = handler
  end

  def poll
    loop do
      response = sqs.receive_message(
        queue_url: queue_url,
        max_number_of_messages: MAX_MESSAGES,
        wait_time_seconds: WAIT_TIME
      )

      response.messages.each do |msg|
        process_message(msg)
      end
    end
  end

  private

  def process_message(msg)
    event = JSON.parse(msg.body, symbolize_names: true)

    # Idempotency check — skip if already processed
    return if ProcessedEvent.exists?(idempotency_key: event[:idempotency_key])

    @handler.call(event)

    # Mark as processed and delete from queue
    ProcessedEvent.create!(idempotency_key: event[:idempotency_key])
    sqs.delete_message(queue_url: queue_url, receipt_handle: msg.receipt_handle)
  rescue => e
    # Don't delete — SQS will retry after visibility timeout
    Rails.logger.error("[SqsConsumer] Failed: #{e.message}")
    StatsD.increment("sqs.consumer.error", tags: ["queue:#{@queue_name}"])
  end
end`}
        </CodeBlock>

        <CodeBlock title="dead letter queue — terraform">
{`resource "aws_sqs_queue" "order_events_dlq" {
  name                      = "order-events-dlq"
  message_retention_seconds = 1209600  # 14 days — gives you time to investigate
}

resource "aws_sqs_queue" "order_events" {
  name                       = "order-events"
  visibility_timeout_seconds = 300     # 5 min — must exceed processing time
  receive_wait_time_seconds  = 20      # long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_events_dlq.arn
    maxReceiveCount     = 3  # move to DLQ after 3 failures
  })
}`}
        </CodeBlock>

        <p>
          The dead letter queue is your safety net. Messages that fail 3 times land there
          instead of being retried forever. Set a 14-day retention so you have time to
          investigate and replay. Monitor the DLQ depth — if it&apos;s growing, something
          is systematically wrong with your consumer.
        </p>
      </Section>

      {/* 8 — IAM Least Privilege */}
      <Section id="iam-least-privilege" number={8} title="IAM: Least Privilege in Practice">
        <p>
          The fastest way to ship is <code className="text-cyan-400">Action: &quot;*&quot;</code>,{' '}
          <code className="text-cyan-400">Resource: &quot;*&quot;</code>. It&apos;s also the fastest
          way to get breached. Least privilege means each role can only do exactly what it needs —
          nothing more. It&apos;s tedious to set up and absolutely worth it.
        </p>
        <p>
          On ECS, there are two roles that matter: the <strong>task role</strong> (what your
          application code can do) and the <strong>execution role</strong> (what ECS itself
          needs to launch your task). Never combine them.
        </p>

        <CodeBlock title="IAM — the wrong way">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
// Congratulations, your Rails app can now delete your
// production database, modify IAM policies, and spin up
// Bitcoin miners on your account.`}
        </CodeBlock>

        <CodeBlock title="IAM — task role (what your app needs)">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Uploads",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::my-app-uploads/*"
    },
    {
      "Sid": "SQSPublish",
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:GetQueueUrl"],
      "Resource": "arn:aws:sqs:us-east-1:123456789:order-events"
    },
    {
      "Sid": "SSMReadSecrets",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParametersByPath"],
      "Resource": "arn:aws:ssm:us-east-1:123456789:parameter/myapp/prod/*"
    }
  ]
}`}
        </CodeBlock>

        <p>
          Scope every action to the specific resource ARN. Your app needs to read from one
          S3 bucket? Grant access to that bucket only — not all of S3. It needs to send to
          one SQS queue? Name that queue in the resource. The extra 5 minutes spent scoping
          policies is insurance against the day something goes wrong.
        </p>
      </Section>

      {/* 9 — Cost Awareness */}
      <Section id="cost-awareness" number={9} title="Cost Awareness">
        <p>
          AWS will happily charge you $10,000/month for things you didn&apos;t know you
          were using. Cost awareness isn&apos;t about being cheap — it&apos;s about
          understanding what you&apos;re paying for and making intentional decisions instead
          of discovering surprises on the monthly bill.
        </p>
        <p>
          The biggest traps I&apos;ve seen in production:
        </p>
        <p>
          <strong>NAT Gateway:</strong> $0.045/GB of data processed. If your ECS tasks in
          private subnets make outbound API calls, every byte goes through the NAT Gateway.
          A chatty app doing 1TB/month of outbound data pays $45 in NAT fees alone. Use VPC
          endpoints for AWS services (S3, SQS, ECR) to bypass the NAT entirely — they&apos;re
          a few dollars/month vs hundreds in NAT charges.
        </p>
        <p>
          <strong>Data transfer:</strong> Ingress is free, egress is not. Cross-region data
          transfer, CloudFront origin fetches, and even cross-AZ traffic between ECS tasks
          add up. Keep services in the same AZ when possible, and use CloudFront to reduce
          origin fetches.
        </p>
        <p>
          <strong>RDS storage:</strong> Provisioned IOPS are expensive. Most apps work fine
          with gp3 storage — you get 3,000 IOPS baseline for free. Only provision IOPS if
          you&apos;ve measured that you&apos;re hitting the gp3 ceiling.
        </p>
        <p>
          <strong>Idle resources:</strong> That staging environment running 24/7 with the same
          instance size as production? Schedule it to stop overnight. That RDS snapshot from 2
          years ago? Delete it. Unused Elastic IPs? They cost money when <em>not</em> attached.
        </p>
        <p>
          Set up AWS Budgets with alerts at 80% and 100% of your expected spend. It takes
          5 minutes and has saved me from billing surprises more than once.
        </p>
      </Section>

      {/* 10 — Logging & Tracing */}
      <Section id="logging-tracing" number={10} title="Logging & Tracing Across Services">
        <p>
          When a request touches your ALB, hits an ECS task, queries RDS, publishes to SQS,
          and triggers a background consumer — how do you trace a problem? The answer is
          correlated, structured logging with a request ID that follows the entire chain.
        </p>

        <CodeBlock title="config/initializers/request_id_middleware.rb">
{`# Ensure every request has a trace ID that propagates everywhere
class RequestIdMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    # Use ALB trace ID if present, otherwise generate one
    request_id = env["HTTP_X_AMZN_TRACE_ID"] ||
                 env["HTTP_X_REQUEST_ID"] ||
                 SecureRandom.uuid

    # Make it available to the entire request lifecycle
    Thread.current[:request_id] = request_id
    Rails.logger.tagged(request_id) do
      status, headers, response = @app.call(env)
      headers["X-Request-Id"] = request_id
      [status, headers, response]
    end
  ensure
    Thread.current[:request_id] = nil
  end
end`}
        </CodeBlock>

        <CodeBlock title="config/environments/production.rb — JSON logging">
{`# Structured JSON logs that CloudWatch can parse and filter
config.log_formatter = proc do |severity, time, _progname, msg|
  {
    level: severity,
    time: time.iso8601(3),
    request_id: Thread.current[:request_id],
    msg: msg
  }.compact.to_json + "\\n"
end

config.logger = ActiveSupport::TaggedLogging.new(
  ActiveSupport::Logger.new(STDOUT)
)
config.log_level = :info`}
        </CodeBlock>

        <CodeBlock title="CloudWatch Logs Insights — querying">
{`# Find all logs for a specific request
fields @timestamp, @message
| filter request_id = "1-abc123-def456"
| sort @timestamp asc

# Find slow database queries
fields @timestamp, msg, duration
| filter msg like /SQL/
| filter duration > 100
| sort duration desc
| limit 20

# Error rate by endpoint over the last hour
fields @timestamp, msg, status
| filter status >= 500
| stats count(*) as errors by bin(5m)

# Trace a specific order across all services
fields @timestamp, @message, @logStream
| filter @message like /order_id.*12345/
| sort @timestamp asc`}
        </CodeBlock>

        <p>
          The request ID is the thread that ties everything together. When your SQS consumer
          processes a message, include the originating request ID in the log context. When
          your background job runs, tag it with the request ID that triggered it. Six months
          from now when someone asks &quot;what happened to order #12345?&quot;, you can trace
          the full lifecycle in one CloudWatch query.
        </p>
      </Section>
    </ContentPage>
  )
}
