#!/bin/bash

# Set environment variables for testing
export TEST_PAGE="TEST MCP"
export API_URL="http://localhost:9000"
export VERBOSE="true"

# Create test directories if they don't exist
mkdir -p test/test-images

# Test with various text formats
echo "Testing paragraph upload..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=This is a test paragraph" \
  -F "formatType=paragraph"

echo -e "\n\nTesting heading upload..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=Important Test Heading" \
  -F "formatType=heading_1"

echo -e "\n\nTesting to-do item upload..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=Complete testing suite" \
  -F "formatType=to_do"

echo -e "\n\nTesting auto-format detection..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=# This should be detected as a heading"

# Generate test image for testing
cat > test/test-images/test-image.svg << EOF
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#333">Test Image</text>
</svg>
EOF

echo -e "\n\nTesting image upload..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "file=@test/test-images/test-image.svg"

echo -e "\n\nTesting mixed content (text + image)..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=This is an image caption" \
  -F "file=@test/test-images/test-image.svg"

echo -e "\n\nTesting section targeting..."
curl -X POST "${API_URL}/upload" \
  -F "pageTitle=${TEST_PAGE}" \
  -F "content=This content should go in the Test Section" \
  -F "sectionTitle=Test Section"

echo -e "\n\nTests completed." 