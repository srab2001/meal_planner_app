const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PDFParser {
  constructor() {
    this.pythonScript = path.join(__dirname, 'harris_teeter_pdf_parser.py');
  }

  async parsePDF(pdfPath) {
    try {
      const { stdout, stderr } = await execPromise(
        `python3 ${this.pythonScript} "${pdfPath}"`
      );

      if (stderr) {
        console.error('PDF Parser stderr:', stderr);
      }

      const result = JSON.parse(stdout);
      return result.items || [];

    } catch (error) {
      console.error('Error parsing PDF:', error);
      return [];
    }
  }

  async parseFromURL(pdfURL, downloadPath) {
    try {
      const response = await fetch(pdfURL);
      const buffer = await response.arrayBuffer();
      
      fs.writeFileSync(downloadPath, Buffer.from(buffer));
      
      return await this.parsePDF(downloadPath);
    } catch (error) {
      console.error('Error downloading/parsing PDF:', error);
      return [];
    }
  }
}

module.exports = PDFParser;
