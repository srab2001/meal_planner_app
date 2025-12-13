# Scripts Directory

This directory contains utility scripts for the Meal Planner application.

## Available Scripts

### md-to-pdf.sh

Converts markdown files to PDF format using pandoc and wkhtmltopdf.

#### Requirements

- pandoc
- wkhtmltopdf
- pdfinfo (optional, for page count display)

Install on Ubuntu/Debian:
```bash
sudo apt-get install pandoc wkhtmltopdf
```

#### Usage

**Direct execution:**
```bash
# Convert with automatic output filename (same as input with .pdf extension)
./scripts/md-to-pdf.sh HEALTH_PORTAL_EXPANSION_STRATEGY.md

# Convert with custom output filename
./scripts/md-to-pdf.sh HEALTH_PORTAL_EXPANSION_STRATEGY.md output.pdf
```

**Using npm script:**
```bash
# Convert with automatic output filename
npm run md-to-pdf -- HEALTH_PORTAL_EXPANSION_STRATEGY.md

# Convert with custom output filename
npm run md-to-pdf -- HEALTH_PORTAL_EXPANSION_STRATEGY.md output.pdf
```

#### Features

- ✅ Automatic output filename generation
- ✅ Input validation (file existence check)
- ✅ Dependency verification (pandoc, wkhtmltopdf)
- ✅ Progress feedback with colored output
- ✅ PDF metadata (title, pages, file size)
- ✅ Error handling with clear messages

#### Example Output

```bash
$ ./scripts/md-to-pdf.sh HEALTH_PORTAL_EXPANSION_STRATEGY.md
Converting markdown to PDF...
Input:  HEALTH_PORTAL_EXPANSION_STRATEGY.md
Output: HEALTH_PORTAL_EXPANSION_STRATEGY.pdf
Loading page (1/2)
[============================================================] 100%
Printing pages (2/2)
✓ Conversion successful!
  File size: 84K
  Pages: 9
  Output: HEALTH_PORTAL_EXPANSION_STRATEGY.pdf
```

#### Converting Other Markdown Files

The script works with any markdown file in the repository:

```bash
# Convert other strategy documents
./scripts/md-to-pdf.sh ADVERTISING_MONETIZATION_STRATEGY.md
./scripts/md-to-pdf.sh POSTGRESQL_MIGRATION_STRATEGY.md
./scripts/md-to-pdf.sh REQUIREMENTS_AND_FEATURES.md

# Convert documentation
./scripts/md-to-pdf.sh README.md
./scripts/md-to-pdf.sh QUICKSTART.md
```

#### Troubleshooting

**Error: pandoc is not installed**
```bash
sudo apt-get install pandoc
```

**Error: wkhtmltopdf is not installed**
```bash
sudo apt-get install wkhtmltopdf
```

**Error: File not found**
- Check the file path is correct
- Ensure you're in the project root directory
- Use relative or absolute paths as needed

#### Technical Details

- Uses pandoc for markdown processing
- Uses wkhtmltopdf as the PDF rendering engine
- Generates PDF version 1.4
- Includes document metadata (title)
- Converts to HTML5 intermediate format for better styling
