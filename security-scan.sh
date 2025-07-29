#!/bin/bash


set -e

IMAGE_NAME="bank-server"
TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "🔨 Building Docker image: ${FULL_IMAGE_NAME}"
docker build -t "${FULL_IMAGE_NAME}" .

echo "🔍 Installing Trivy (if not already installed)..."
if ! command -v trivy &> /dev/null; then
    echo "Installing Trivy..."
    sudo apt-get update
    sudo apt-get install -y wget apt-transport-https gnupg lsb-release
    wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
    echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
    sudo apt-get update
    sudo apt-get install -y trivy
fi

echo "🛡️  Running Trivy security scan..."
echo "Scanning for HIGH and CRITICAL vulnerabilities..."

trivy image --severity HIGH,CRITICAL --ignore-unfixed "${FULL_IMAGE_NAME}"

echo "📊 Generating detailed report..."
trivy image --format json --output trivy-report.json "${FULL_IMAGE_NAME}"

echo "✅ Security scan completed!"
echo "📄 Detailed report saved to: trivy-report.json"

VULN_COUNT=$(trivy image --format json --quiet "${FULL_IMAGE_NAME}" | jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length')

if [ "${VULN_COUNT}" -gt 0 ]; then
    echo "⚠️  Found ${VULN_COUNT} HIGH/CRITICAL vulnerabilities!"
    echo "Please review the scan results and update dependencies as needed."
    exit 1
else
    echo "✅ No HIGH or CRITICAL vulnerabilities found!"
fi
