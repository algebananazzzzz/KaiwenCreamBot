locals {
  execution_role_name   = "${var.env}-mgmt-iamrole-${var.project_code}"
  execution_policy_name = "${var.env}-mgmt-iampolicy-${var.project_code}"
}

module "execution_role" {
  source = "./modules/iam_role"
  name   = local.execution_role_name
  policy_attachments = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  ]
}

