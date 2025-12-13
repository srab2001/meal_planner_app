#!/bin/bash

# Markdown to PDF Converter Script
# Usage: ./scripts/md-to-pdf.sh <input.md> [output.pdf]
# If output filename is not provided, it will use the same name as input with .pdf extension

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if input file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No input file specified${NC}"
    echo "Usage: $0 <input.md> [output.pdf]"
    echo "Example: $0 HEALTH_PORTAL_EXPANSION_STRATEGY.md"
    exit 1
fi

INPUT_FILE="$1"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: File '$INPUT_FILE' not found${NC}"
    exit 1
fi

# Check if input file is a markdown file
if [[ ! "$INPUT_FILE" =~ \.md$ ]]; then
    echo -e "${YELLOW}Warning: Input file does not have .md extension${NC}"
fi

# Determine output filename
if [ -z "$2" ]; then
    OUTPUT_FILE="${INPUT_FILE%.md}.pdf"
else
    OUTPUT_FILE="$2"
fi

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo -e "${RED}Error: pandoc is not installed${NC}"
    echo "Install it with: sudo apt-get install pandoc"
    exit 1
fi

# Check if wkhtmltopdf is installed
if ! command -v wkhtmltopdf &> /dev/null; then
    echo -e "${RED}Error: wkhtmltopdf is not installed${NC}"
    echo "Install it with: sudo apt-get install wkhtmltopdf"
    exit 1
fi

echo -e "${GREEN}Converting markdown to PDF...${NC}"
echo "Input:  $INPUT_FILE"
echo "Output: $OUTPUT_FILE"

# Convert markdown to PDF using pandoc with wkhtmltopdf engine
pandoc "$INPUT_FILE" \
    -o "$OUTPUT_FILE" \
    --pdf-engine=wkhtmltopdf \
    --metadata title="$(basename "$INPUT_FILE" .md)" \
    --from markdown \
    --to html5 \
    --standalone

# Check if conversion was successful
if [ $? -eq 0 ] && [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    PAGE_COUNT=$(pdfinfo "$OUTPUT_FILE" 2>/dev/null | grep "Pages:" | awk '{print $2}')
    
    echo -e "${GREEN}✓ Conversion successful!${NC}"
    echo "  File size: $FILE_SIZE"
    if [ ! -z "$PAGE_COUNT" ]; then
        echo "  Pages: $PAGE_COUNT"
    fi
    echo "  Output: $OUTPUT_FILE"
else
    echo -e "${RED}✗ Conversion failed${NC}"
    exit 1
fi
